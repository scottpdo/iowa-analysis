const fs = require("fs");
const { argv } = require("yargs");
const { utils } = require("flocc");
const run = require("./shared/run");
const setup = require("./shared/setup");

const path = argv.path;
if (!path) {
  console.error(
    "Please enter the path to the simulation config, i.e. --path=sims/base"
  );
  return;
}

const CONFIG = require("./" + path + "/config.json");
CONFIG.START = parseInt(argv.start) || 0;
CONFIG.RUNS = parseInt(argv.runs) || 1;
CONFIG.DIR = __dirname + "/" + path;

// make data directory if it does not exist
if (!fs.existsSync(__dirname + "/" + path + "/data")) {
  fs.mkdirSync(__dirname + "/" + path + "/data");
}

function init(i) {
  console.log(`Initializing run ${i}`);
  utils.seed(i);
  setup(CONFIG);
  run(CONFIG, i, init);
}

init(CONFIG.START);
