module.exports = function (environment) {
  return environment.getAgents().filter((a) => a.get("type") === "voter");
};
