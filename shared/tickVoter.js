const { utils } = require("flocc");

module.exports = function tickVoter(agent) {
  const { environment } = agent;
  const getCandidates = () => {
    return environment.getAgents().filter((a) => a.get("type") === "candidate");
  };

  const candidates = agent.environment.memo(getCandidates);
  let candidate = agent.get("candidate");

  // voting for the first time
  if (!candidate) {
    candidate = utils.sample(
      candidates,
      candidates.map((c) => {
        const id = Math.max(1 - utils.distance(c, agent), 0.0001);
        return id ** 2;
      })
    );
  } else if (candidate && candidate.get("valid") === false) {
    const { network } = environment.helpers;
    const neighborCandidates = network
      .neighbors(agent)
      .map((a) => a.get("candidate"));
    candidate = utils.sample(neighborCandidates);
    if (!candidate) return;
  }

  candidate.increment("votes");
  return { candidate, color: candidate.get("color") };
};
