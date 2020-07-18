const { Agent } = require("flocc");
const xy = require("./distribution");

module.exports = function addCandidates(environment, CANDIDATES) {
  const voters = environment
    .getAgents()
    .filter((a) => a.get("type") === "voter");

  for (let i = 0; i < CANDIDATES; i++) {
    const { x, y } = xy();
    const candidate = new Agent({
      x,
      y,
      i,
      size: 6,
      type: "candidate",
      votes: 0,
      votePercentage: (a) => a.get("votes") / voters.length,
    });
    environment.addAgent(candidate);
    environment.helpers.network.addAgent(candidate);
  }
};
