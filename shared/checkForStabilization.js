const getVoters = require("./getVoters");
const getCandidates = require("./getCandidates");

module.exports = function checkForStabilization(
  i,
  environment,
  THRESHOLD,
  run,
  init
) {
  const candidates = getCandidates(environment);
  const voters = getVoters(environment);

  const done = candidates
    .map((c) => c.get("votes"))
    .every((v) => v === 0 || v / voters.length > THRESHOLD);
  if (done) {
    console.log(`Run ${i} stabilized at time ${environment.time}`);
    return init ? init(i + 1) : null;
  } else if (environment.time === 100) {
    console.log(`Run ${i} has not yet stabilized at ${environment.time}`);
    return init ? init(i + 1) : null;
  }

  candidates.forEach((c) => {
    const { votes } = c.getData();
    const valid = votes / voters.length >= THRESHOLD;
    c.set("valid", valid);
    // reset votes
    c.set("lastVotes", votes);
    c.set("votes", 0);
  });

  run();
};
