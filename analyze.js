const { parse } = require("@fast-csv/parse");
const { utils } = require("flocc");
const { argv } = require("yargs");
const fs = require("fs");
const { exit } = require("process");

const path = argv.path;
if (!path) {
  console.warn(
    "Please enter the path to the simulation, e.g. --path=sims/base"
  );
  exit();
}

const startingPercentages = {};
const endingPercentages = {};

const rounds = [];
const victors = [];
const firstPlacePercentages = [];
const secondPlacePercentages = [];

function analyze(subdirName, finished) {
  const startCsv = fs.readFileSync(
    `${__dirname}/${path}/data/${subdirName}/001.csv`,
    "utf-8"
  );
  const startStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ i, votes, votePercentage }) => {
      if (!startingPercentages[i]) startingPercentages[i] = [];
      startingPercentages[i].push(+votePercentage);
    });
  startStream.write(startCsv);
  startStream.end();

  let endCsv;
  let round = 2;
  while (
    fs.existsSync(
      `${__dirname}/${path}/data/${subdirName}/${utils.zfill(
        round.toString(),
        3
      )}.csv`
    )
  ) {
    round++;
  }
  round--;
  rounds.push(round);
  if (finished) {
    console.log(`-- Mean # of rounds ${utils.mean(rounds)}`);
  }
  endCsv = fs.readFileSync(
    `${__dirname}/${path}/data/${subdirName}/${utils.zfill(
      round.toString(),
      3
    )}.csv`,
    "utf-8"
  );
  let roundHighest = 0;
  let roundSecondHighest = 0;
  const endStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ i, x, y, votePercentage }) => {
      if (!endingPercentages[i]) endingPercentages[i] = [];
      endingPercentages[i].push(+votePercentage);

      if (i === "0") {
        victors.push(0);
      }
      if (+votePercentage > 0.15) {
        victors[victors.length - 1]++;
      }
      if (+votePercentage > roundHighest) {
        // update 2nd place
        roundSecondHighest = roundHighest;
        roundHighest = +votePercentage;
      } else if (+votePercentage > roundSecondHighest) {
        roundSecondHighest = +votePercentage;
      }
    })
    .on("end", () => {
      firstPlacePercentages.push(roundHighest);
      secondPlacePercentages.push(roundSecondHighest);
      if (!finished) return;
      console.log(`-- Mean # of victors: ${utils.mean(victors)}`);
      console.log(
        `-- Mean % of 1st place: ${utils.mean(firstPlacePercentages)}`
      );
      console.log(
        `-- Mean % of 2nd place: ${utils.mean(secondPlacePercentages)}`
      );
      // console.table(
      //   [
      //     [0, 0.05],
      //     [0.05, 0.1],
      //     [0.1, 0.2],
      //     [0.2, 0.3],
      //     [0.3, 0.4],
      //     [0.5, 0.6],
      //     [0.6, 0.7],
      //     [0.7, 0.8],
      //     [0.8, 0.9],
      //     [0.9, 1],
      //   ].map(([min, max]) => {
      //     const percentages = distances
      //       .filter(({ distanceToMeanVoter }) => {
      //         return distanceToMeanVoter > min && distanceToMeanVoter < max;
      //       })
      //       .map(({ votePercentage }) => votePercentage);

      //     return {
      //       range: `${min} - ${max}`,
      //       mean: utils.mean(percentages),
      //       median: utils.median(percentages),
      //     };
      //   })
      // );
    });
  endStream.write(endCsv);
  endStream.end();
}

const data = fs.readdirSync(__dirname + "/" + path + "/data");
console.log(`Analyzing ${data.length} simulations`);
data.forEach((subdir, i) => {
  analyze(subdir, i === data.length - 1);
});
