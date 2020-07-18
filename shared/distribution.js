const { utils } = require("flocc");

module.exports = function xy() {
  const x = utils.random(-1, 1, true);
  const y = utils.random(-1, 1, true);
  if (utils.distance({ x, y }, { x: 0, y: 0 }) > 1) return xy();
  return { x, y };
};
