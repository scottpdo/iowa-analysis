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
const firstPlaceDistances = [];
const secondPlaceDistances = [];
const allDistances = [];
const underdogs = {};

const data = fs.readdirSync(__dirname + "/" + path + "/data");
console.log(`Analyzing ${data.length} simulations`);
data.forEach((subdir, i) => {
  analyze(subdir, i === data.length - 1);
});

function analyze(subdirName, finished) {
  const startCsv = fs.readFileSync(
    `${__dirname}/${path}/data/${subdirName}/001.csv`,
    "utf-8"
  );
  const startStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ i, votePercentage }) => {
      if (!underdogs[subdirName]) underdogs[subdirName] = {};
      if (+votePercentage < 0.15) {
        underdogs[subdirName][i] = +votePercentage;
      }
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
    console.log(
      `-- Mean # of rounds ${utils.mean(rounds)} (Median: ${utils.median(
        rounds
      )})`
    );
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
  let roundFirstPlaceDistance = -1;
  let roundSecondPlaceDistance = -1;
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
        roundSecondPlaceDistance = roundFirstPlaceDistance;
        // update 1st place
        roundHighest = +votePercentage;
        roundFirstPlaceDistance = utils.distance({ x, y }, { x: 0, y: 0 });
      } else if (+votePercentage > roundSecondHighest) {
        roundSecondHighest = +votePercentage;
        roundSecondPlaceDistance = utils.distance({ x, y }, { x: 0, y: 0 });
      }

      if (i in underdogs[subdirName]) {
        if (+votePercentage < 0.15) {
          delete underdogs[subdirName][i];
        } else {
          const start = underdogs[subdirName][i];
          underdogs[subdirName][i] = [start, +votePercentage];
        }
      }

      allDistances.push(utils.distance({ x, y }, { x: 0, y: 0 }));
    })
    .on("end", () => {
      firstPlacePercentages.push(roundHighest);
      secondPlacePercentages.push(roundSecondHighest);
      if (roundFirstPlaceDistance >= 0)
        firstPlaceDistances.push(roundFirstPlaceDistance);
      if (roundSecondPlaceDistance >= 0)
        secondPlaceDistances.push(roundSecondPlaceDistance);
      if (!finished) return;
      console.log(`-- Mean # of victors: ${utils.mean(victors)}`);
      console.log(
        `-- Mean % of 1st place: ${100 * utils.mean(firstPlacePercentages)}%`
      );
      console.log(
        `-- Mean % of 2nd place: ${100 * utils.mean(secondPlacePercentages)}%`
      );
      console.log(
        `-- Mean of 1st place distances: ${utils.mean(firstPlaceDistances)}`
      );
      console.log(
        `-- Mean of 2nd place distances: ${utils.mean(secondPlaceDistances)}`
      );
      console.log(
	`-- Mean overall distance: ${utils.mean(allDistances)}`
      );
      Object.keys(underdogs).forEach((round) => {
        if (Object.keys(underdogs[round]).length === 0) {
          delete underdogs[round];
        }
      });
      console.log(
        `-- ${
          (100 * Object.keys(underdogs).length) / data.length
        } % of rounds have underdogs`
      );
      // console.log(`   Underdogs: ${Object.keys(underdogs).join(", ")}`);
    });
  endStream.write(endCsv);
  endStream.end();
}
