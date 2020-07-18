const { Agent, Vector, utils } = require("flocc");
const xy = require("./distribution");

module.exports = function addCandidates(environment, CANDIDATES) {
  const voters = environment
    .getAgents()
    .filter((a) => a.get("type") === "voter");
  const meanVoter = new Vector(0, 0);
  voters.forEach((voter) => {
    meanVoter.add(new Vector(voter.x, voter.y));
  });
  meanVoter.multiplyScalar(1 / voters.length);

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
      distanceToMeanVoter: (c) => utils.distance(c, meanVoter),
    });
    environment.addAgent(candidate);
    environment.helpers.network.addAgent(candidate);
  }
};
