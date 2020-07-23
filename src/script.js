import {
  Agent,
  Environment,
  CanvasRenderer,
  Network,
  utils,
  TableRenderer,
} from "flocc";
import addVoters from "../shared/addVoters";
import addCandidates from "../shared/addCandidates";
import connect from "../shared/connect";
import rewire from "../shared/rewire";
import checkForStabilization from "../shared/checkForStabilization";

utils.seed(0);

const CONFIG = {
  START: 0,
  RUNS: 1,
  THRESHOLD: 0.15,
  VOTERS: 500,
  CANDIDATES: 8,
  REWIRE: 0.03,
  CONNECTIONS: [3, 3, 4, 5, 6],
};

function run(CONFIG, i, init) {
  const { START, RUNS, environment } = CONFIG;
  environment.tick({ randomizeOrder: true });

  window.setTimeout(() => {
    checkForStabilization(
      i,
      CONFIG,
      () => run(CONFIG, i, init),
      i < START + RUNS - 1 ? init : null
    );
  }, 1000);
}

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

const width = 500;
const height = 500;

let compass;

const xy = () => {
  const x = utils.random(-1, 1, true);
  const y = utils.random(-1, 1, true);
  if (utils.distance({ x, y }, { x: 0, y: 0 }) > 1) return xy();
  return { x, y };
};

function setup(CONFIG) {
  CONFIG.environment = new Environment();
  const network = new Network();
  CONFIG.environment.use(network);

  compass = new CanvasRenderer(CONFIG.environment, {
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

  const table = new TableRenderer(CONFIG.environment, {
    filter: (a) => a.get("type") === "candidate",
  });
  table.mount("#table");
  table.columns = ["i", "color", "votes", "x", "y", "votePercentage"];

  addVoters(CONFIG);

  addCandidates(CONFIG, colors);
  // connect voters
  connect(CONFIG);
  // randomly rewire
  rewire(CONFIG);
}

setup(CONFIG);
run(CONFIG, 0);
