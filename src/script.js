import {
  Agent,
  Environment,
  CanvasRenderer,
  Network,
  KDTree,
  utils,
  TableRenderer,
  VERSION,
} from "flocc";

utils.seed(95);

// function onClick(e) {
//   let { x, y } = e;
//   x -= e.target.getBoundingClientRect().x;
//   y -= e.target.getBoundingClientRect().y;
//   x /= e.target.getBoundingClientRect().width;
//   y /= e.target.getBoundingClientRect().height;
//   x -= 0.5;
//   y -= 0.5;
//   //   console.log(x, y);
//   const agents = tree.agentsWithinDistance({ x, y }, 0.01);
//   if (agents.length === 0) return;
//   const closest = agents[0];
//   console.log(closest);
//   console.log(network.neighbors(closest).map((a) => a.id));
// }

// document.addEventListener("click", onClick);

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

const width = 400;
const height = 400;

const xy = () => {
  const x = utils.random(-1, 1, true);
  const y = utils.random(-1, 1, true);
  if (utils.distance({ x, y }, { x: 0, y: 0 }) > 1) return xy();
  return { x, y };
};

let environment;
let network;
let compass;
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

  compass = new CanvasRenderer(environment, {
    width,
    height,
    scale: width / 2,
    origin: {
      x: -1,
      y: -1,
    },
    connectionColor: "#ddd",
  });
  compass.mount("#compass");

  for (let i = 0; i < VOTERS; i++) {
    const { x, y } = xy();
    const voter = new Agent({
      x,
      y,
      color: "gray",
      size: 3,
      type: "voter",
    });
    voter.addRule(tickVoter);
    environment.addAgent(voter);
    network.addAgent(voter);
  }
  tree = new KDTree(getVoters(), 2);
  environment.use(tree);

  table = new TableRenderer(environment, {
    filter: (a) => a.get("type") === "candidate",
  });
  table.columns = ["color", "votes", "x", "y", "votePercentage"];
  table.mount("#table");

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
    });
    environment.addAgent(candidate);
    network.addAgent(candidate);
  }
  const voters = getVoters();
  voters.forEach((voter) => {
    const n = 3;
    let d = 0;
    let neighbors;
    do {
      neighbors = tree.agentsWithinDistance(voter, (d += 0.01));
    } while (neighbors.length < n);
    neighbors.forEach((neighbor) => {
      const connected = network.connect(voter, neighbor);
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

function log(showWinner) {
  const voteCount = document.getElementById("vote-count");
  const winner = showWinner ? "All remaining candidates over 15%" : "";
  voteCount.innerHTML = `<h3>Round ${environment.time - 1}: ${winner}</h3>`;
}

function run() {
  environment.tick({ randomizeOrder: true });

  const candidates = environment.memo(getCandidates);
  const voters = environment.memo(getVoters);

  const done = candidates
    .map((c) => c.get("votes"))
    .every((v) => v === 0 || v / VOTERS > 0.15);
  if (environment.time > 1 && done) {
    console.log(`Stabilized at time ${environment.time}`);
    return log(true);
  } else if (environment.time === 100) {
    console.log(`Has not yet stabilized at ${environment.time}`);
    return;
  }

  log();

  candidates.forEach((c) => {
    const { votes } = c.getData();
    const valid = votes / voters.length >= 0.15;
    c.set("valid", valid);
    // reset votes
    c.set("lastVotes", votes);
    c.set("votes", 0);
  });

  setTimeout(run, 500);
}

setup();
run();
