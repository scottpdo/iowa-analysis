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

const RUNS = parseInt(argv.runs) || 1;

const colors = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "black",
];
const VOTERS = 500;
const CANDIDATES = colors.length;

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
  agent.set("color", candidate.get("color"));
}

function setup() {
  environment = new Environment();
  network = new Network();
  environment.use(network);

  table = new TableRenderer(environment, {
    filter: (a) => a.get("type") === "candidate",
    type: "csv",
  });
  table.columns = [
    "color",
    "votes",
    "x",
    "y",
    "votePercentage",
    "distanceToMeanVoter",
  ];

  for (let i = 0; i < VOTERS; i++) {
    const { x, y } = xy();
    const voter = new Agent({
      candidate: null,
      x,
      y,
      color: "gray",
      size: 2,
      type: "voter",
    });
    voter.addRule(tickVoter);
    environment.addAgent(voter);
    network.addAgent(voter);
  }
  tree = new KDTree(getVoters(), 2);
  environment.use(tree);

  const voters = getVoters();
  const meanVoter = new Vector(0, 0);
  voters.forEach((voter) => {
    meanVoter.add(new Vector(voter.x, voter.y));
  });
  meanVoter.multiplyScalar(1 / VOTERS.length);

  for (let i = 0; i < CANDIDATES; i++) {
    const { x, y } = xy();
    const candidate = new Agent({
      x,
      y,
      color: colors[i],
      size: 6,
      type: "candidate",
      votes: 0,
      votePercentage: (a) => a.get("votes") / VOTERS,
      distanceToMeanVoter: (c) => utils.distance(c, meanVoter),
    });
    environment.addAgent(candidate);
    network.addAgent(candidate);
  }
  // connect voters
  voters.forEach((voter) => {
    const n = 3;
    let d = 0;
    let neighbors;
    do {
      neighbors = tree.agentsWithinDistance(voter, (d += 0.01));
    } while (neighbors.length < n);
    neighbors.forEach((neighbor) => {
      network.connect(voter, neighbor);
    });
  });
  // randomly rewire
  voters.forEach((voter) => {
    const connections = network.neighbors(voter);
    connections.forEach((connect) => {
      if (utils.uniform() < 0.03) {
        network.disconnect(voter, connect);
        network.connect(voter, utils.sample(voters));
      }
    });
  });
}

function run(i) {
  environment.tick({ randomizeOrder: true });

  const seedStr = utils.zfill(i.toString(), 4);
  const dataPath = `./data/${seedStr}`;
  const filePath =
    dataPath + "/" + utils.zfill(environment.time.toString(), 3) + ".csv";
  if (!fs.existsSync(`./data`)) fs.mkdirSync(`./data`);
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
  fs.writeFileSync(filePath, table.output());

  const candidates = environment.memo(getCandidates);
  const voters = environment.memo(getVoters);

  const done = candidates
    .map((c) => c.get("votes"))
    .every((v) => v === 0 || v / VOTERS > 0.15);
  if (done) {
    console.log(`Run ${i} stabilized at time ${environment.time}`);
    return;
  } else if (environment.time === 100) {
    console.log(`Run ${i} has not yet stabilized at ${environment.time}`);
    return;
  }

  candidates.forEach((c) => {
    const { votes } = c.getData();
    const valid = votes / voters.length >= 0.15;
    c.set("valid", valid);
    // reset votes
    c.set("lastVotes", votes);
    c.set("votes", 0);
  });

  run(i);
}

for (let i = 0; i < RUNS; i++) {
  utils.seed(i);
  setup();
  run(i);
}
