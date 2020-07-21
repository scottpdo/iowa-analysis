const { Environment, Network, TableRenderer } = require("flocc");
const addVoters = require("./addVoters");
const addCandidates = require("./addCandidates");
const connect = require("./connect");
const rewire = require("./rewire");

module.exports = function setup(CONFIG) {
  CONFIG.environment = new Environment();
  const network = new Network();
  CONFIG.environment.use(network);

  table = new TableRenderer(CONFIG.environment, {
    filter: (a) => a.get("type") === "candidate",
    type: "csv",
  });
  table.columns = ["i", "votes", "x", "y", "votePercentage"];

  addVoters(CONFIG);

  addCandidates(CONFIG);
  // connect voters
  connect(CONFIG);
  // randomly rewire
  rewire(CONFIG);
};
