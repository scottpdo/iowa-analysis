const { Environment, KDTree, Network, TableRenderer } = require("flocc");
const addVoters = require("./addVoters");
const getVoters = require("./getVoters");
const addCandidates = require("./addCandidates");
const connect = require("./connect");
const rewire = require("./rewire");

module.exports = function setup({ VOTERS, CANDIDATES, REWIRE }) {
  environment = new Environment();
  network = new Network();
  environment.use(network);

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

  addVoters(environment, VOTERS);
  tree = new KDTree(getVoters(environment), 2);
  environment.use(tree);

  addCandidates(environment, CANDIDATES);
  // connect voters
  connect(environment);
  // randomly rewire
  rewire(environment, REWIRE);

  return environment;
};
