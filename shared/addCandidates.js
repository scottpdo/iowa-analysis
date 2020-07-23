const { Agent } = require("flocc");
const xy = require("./distribution");

module.exports = function addCandidates(CONFIG, colors = []) {
  const { environment, CANDIDATES } = CONFIG;
  const voters = environment
    .getAgents()
    .filter((a) => a.get("type") === "voter");

  for (let i = 0; i < CANDIDATES; i++) {
    const { x, y } = xy();
    const candidate = new Agent({
      x,
      y,
      i,
      color:
        colors.length > 0 && colors.length === CANDIDATES ? colors[i] : null,
      size: 6,
      type: "candidate",
      votes: 0,
      votePercentage: (a) => a.get("votes") / voters.length,
    });
    environment.addAgent(candidate);
    environment.helpers.network.addAgent(candidate);
  }
};
