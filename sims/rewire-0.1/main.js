const fs = require("fs");
const { argv } = require("yargs");
const { utils } = require("flocc");
const run = require("../../shared/run");
const setup = require("../../shared/setup");

const CONFIG = {
  START: parseInt(argv.start) || 0,
  RUNS: parseInt(argv.runs) || 1,
  THRESHOLD: 0.15,
  VOTERS: 500,
  CANDIDATES: 8,
  REWIRE: 0.1,
  CONNECTIONS: [3, 3, 4, 5, 6],
  DIR: __dirname,
};

// make data directory if it does not exist
if (!fs.existsSync(__dirname + "/data")) {
  fs.mkdirSync(__dirname + "/data");
}

function init(i) {
  console.log(`Initializing run ${i}`);
  utils.seed(i);
  setup(CONFIG);
  run(CONFIG, i, init);
}

init(CONFIG.START);
