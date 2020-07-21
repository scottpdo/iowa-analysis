const { utils } = require("flocc");
const getVoters = require("./getVoters");

module.exports = function (CONFIG) {
  const { environment, CONNECTIONS } = CONFIG;
  const { network } = environment.helpers;
  const voters = environment
    .getAgents()
    .filter((a) => a.get("type") === "voter");

  voters.forEach((voter) => {
    const n = utils.sample(CONNECTIONS);

    const sorted = Array.from(
      getVoters(environment).filter((a) => a !== voter)
    );
    sorted.sort((a, b) => utils.distance(voter, a) - utils.distance(voter, b));

    const neighbors = sorted.slice(0, n);
    neighbors.forEach((neighbor) => {
      network.connect(voter, neighbor);
    });
  });
};
