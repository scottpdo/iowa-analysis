const fs = require("fs");
const { utils } = require("flocc");
const checkForStabilization = require("./checkForStabilization");

module.exports = function run(
  { DIR, THRESHOLD, START, RUNS },
  i,
  environment,
  init
) {
  environment.tick({ randomizeOrder: true });

  const seedStr = utils.zfill(i.toString(), 4);
  const dataPath = `${DIR}/data/${seedStr}`;
  const filePath =
    dataPath + "/" + utils.zfill(environment.time.toString(), 3) + ".csv";
  if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
  fs.writeFile(filePath, table.output(), () => {
    checkForStabilization(
      i,
      environment,
      THRESHOLD,
      () => run({ DIR, THRESHOLD, START, RUNS }, i, environment, init),
      i < START + RUNS - 1 ? init : null
    );
  });
};
