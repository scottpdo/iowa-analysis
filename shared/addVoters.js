const { Agent } = require("flocc");
const tickVoter = require("./tickVoter");
const xy = require("./distribution");

module.exports = function addVoters(CONFIG) {
  const { environment, VOTERS } = CONFIG;
  for (let i = 0; i < VOTERS; i++) {
    const { x, y } = xy();
    const voter = new Agent({
      candidate: null,
      x,
      y,
      size: 2,
      type: "voter",
    });
    voter.addRule(tickVoter);
    environment.addAgent(voter);
    environment.helpers.network.addAgent(voter);
  }
};
