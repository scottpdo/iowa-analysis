const { utils } = require("flocc");

module.exports = function (environment) {
  const { network, kdtree } = environment.helpers;
  const voters = environment
    .getAgents()
    .filter((a) => a.get("type") === "voter");
  voters.forEach((voter) => {
    const n = utils.sample([3, 3, 4, 5, 6]);
    if (network.neighbors(voter) >= n) return;
    let d = 0;
    let neighbors;
    do {
      neighbors = kdtree.agentsWithinDistance(voter, (d += 0.01));
    } while (neighbors.length < n);
    neighbors.forEach((neighbor) => {
      network.connect(voter, neighbor);
    });
  });
};
