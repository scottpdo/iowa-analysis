const fs = require("fs");
const { argv } = require("yargs");
const {
  Agent,
  Environment,
  KDTree,
  Network,
  TableRenderer,
  utils,
  Vector,
} = require("flocc");

const START = parseInt(argv.start) || 0;
const RUNS = parseInt(argv.runs) || 1;
const THRESHOLD = parseFloat(argv.threshold) || 0.15;
const VOTERS = parseInt(argv.voters) || 500;
const CANDIDATES = parseInt(argv.candidates) || 8;
const REWIRE = parseFloat(argv.rewire) || 0.25;

const xy = () => {
  const x = utils.random(-1, 1, true);
  const y = utils.random(-1, 1, true);
  if (utils.distance({ x, y }, { x: 0, y: 0 }) > 1) return xy();
  return { x, y };
};

let environment;
let network;
let tree;
let table;

function getVoters() {
  return environment.getAgents().filter((a) => a.get("type") === "voter");
}

function getCandidates() {
  return environment.getAgents().filter((a) => a.get("type") === "candidate");
}

function tickVoter(agent) {
  const candidates = environment.memo(getCandidates);
  let candidate = agent.get("candidate");

  // voting for the first time
  if (!candidate) {
    candidate = utils.sample(
      candidates,
      candidates.map((c) => {
        const id = Math.max(1 - utils.distance(c, agent), 0.0001);
        return id ** 2;
      })
    );
  } else if (candidate && candidate.get("valid") === false) {
    const neighborCandidates = network
      .neighbors(agent)
      .map((a) => a.get("candidate"));
    candidate = utils.sample(neighborCandidates);
    if (!candidate) return;
  }

  candidate.increment("votes");
  agent.set("candidate", candidate);
}

function setup() {
  environment = new Environment();
  network = new Network();
  environment.use(network);

  // console.log('  Created environment and network.');

  table = new TableRenderer(environment, {
    filter: (a) => a.get("type") === "candidate",
    type: "csv",
  });
  table.columns = [
    "i",
    "votes",
    "x",
    "y",
    "votePercentage",
    "distanceToMeanVoter",
  ];
  
  // console.log('  Created TableRenderer');

  for (let i = 0; i < VOTERS; i++) {
    const { x, y } = xy();
    const voter = new Agent({
      candidate: null,
      x,
      y,
      size: 2,
      type: "voter",
    });
    voter.addRule(tickVoter);
    environment.addAgent(voter);
    network.addAgent(voter);
  }
  // console.log('  Added voters to environment and network');
  tree = new KDTree(getVoters(), 2);
  environment.use(tree);
  // console.log('  Set up KDTree');

  const voters = getVoters();
  const meanVoter = new Vector(0, 0);
  voters.forEach((voter) => {
    meanVoter.add(new Vector(voter.x, voter.y));
  });
  meanVoter.multiplyScalar(1 / VOTERS.length);
  // console.log('  Located mean voter');

  for (let i = 0; i < CANDIDATES; i++) {
    const { x, y } = xy();
    const candidate = new Agent({
      x,
      y,
      i,
      size: 6,
      type: "candidate",
      votes: 0,
      votePercentage: (a) => a.get("votes") / VOTERS,
      distanceToMeanVoter: (c) => utils.distance(c, meanVoter),
    });
    environment.addAgent(candidate);
    network.addAgent(candidate);
  }
  // console.log('  Added candidates to environment');
  // connect voters
  voters.forEach((voter) => {
    const n = utils.sample([3, 3, 4, 5, 6]);
    if (network.neighbors(voter).length >= n) return;
    let d = 0.1;
    let neighbors = tree.agentsWithinDistance(voter, d);
    while (neighbors.length < n) {
      neighbors = tree.agentsWithinDistance(voter, (d += 0.05));
    }
    neighbors.forEach((neighbor) => {
      network.connect(voter, neighbor);
    });
  });
  // console.log('  Connected voters');
  // randomly rewire
  voters.forEach((voter) => {
    const connections = network.neighbors(voter);
    connections.forEach((connect) => {
      if (utils.uniform() < REWIRE) {
        network.disconnect(voter, connect);
        network.connect(voter, utils.sample(voters));
      }
    });
  });
  // console.log('  Randomly rewired voters');
}

function checkForStabilization(i) {
  const candidates = environment.memo(getCandidates);
  const voters = environment.memo(getVoters);

  const done = candidates
    .map((c) => c.get("votes"))
    .every((v) => v === 0 || v / VOTERS > THRESHOLD);
  if (done) {
    console.log(`Run ${i} stabilized at time ${environment.time}`);
    return i < START + RUNS - 1 ? init(i + 1) : null;
  } else if (environment.time === 100) {
    console.log(`Run ${i} has not yet stabilized at ${environment.time}`);
    return i < START + RUNS - 1 ? init(i + 1) : null;
  }

  candidates.forEach((c) => {
    const { votes } = c.getData();
    const valid = votes / voters.length >= THRESHOLD;
    c.set("valid", valid);
    // reset votes
    c.set("lastVotes", votes);
    c.set("votes", 0);
  });

  run(i);
}

function run(i) {
  // console.log(`Run ${i}, tick ${environment.time}`);
  environment.tick({ randomizeOrder: true });

  const seedStr = utils.zfill(i.toString(), 4);
  const dataPath = `${__dirname}/data/${seedStr}`;
  const filePath =
    dataPath + "/" + utils.zfill(environment.time.toString(), 3) + ".csv";
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
  fs.writeFile(filePath, table.output(), () => checkForStabilization(i));
}

// make data directory if it does not exist
// if (!fs.existsSync(__dirname + "/data")) {
//  fs.mkdirSync(__dirname + "/data");
// }

function init(i) {  
  console.log(`Initializing run ${i}`);
  utils.seed(i);
  console.log(`Finished seeding run ${i}`);
  setup();
  console.log(`Finished setting up/resetting`);
  run(i);
}

init(START);
