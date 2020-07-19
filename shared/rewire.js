const { utils } = require("flocc");
const getVoters = require("./getVoters");

module.exports = function (CONFIG) {
  const { environment, REWIRE } = CONFIG;
  const { network } = environment.helpers;
  const voters = getVoters(environment);
  voters.forEach((voter) => {
    const connections = network.neighbors(voter);
    connections.forEach((connect) => {
      if (utils.uniform() < REWIRE) {
        network.disconnect(voter, connect);
        network.connect(voter, utils.sample(voters));
      }
    });
  });
};
