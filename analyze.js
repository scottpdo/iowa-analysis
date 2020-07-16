const { parse } = require("@fast-csv/parse");
const { utils } = require("flocc");
const fs = require("fs");

const colors = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "black",
];

const startingPercentages = {};
const endingPercentages = {};
colors.forEach((color) => {
  startingPercentages[color] = [];
  endingPercentages[color] = [];
});

const distances = [];

function analyze(subdirName, finished) {
  const startCsv = fs.readFileSync(
    `./data/${subdirName}/001.csv`,
    "utf-8"
  );
  const startStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ color, votes, votePercentage }) => {
      startingPercentages[color].push(+votePercentage);
    });
  startStream.write(startCsv);
  startStream.end();

  let endCsv;
  let i = 2;
  while (
    fs.existsSync(
      `./data/${subdirName}/${utils.zfill(
        i.toString(),
        3
      )}.csv`
    )
  ) {
    i++;
  }
  i--;
  endCsv = fs.readFileSync(
    `./data/${subdirName}/${utils.zfill(
      i.toString(),
      3
    )}.csv`,
    "utf-8"
  );
  let firstRow = true;
  const endStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ color, votes, votePercentage, distanceToMeanVoter }) => {
      endingPercentages[color].push(+votePercentage);

      distances.push({
        distanceToMeanVoter: +distanceToMeanVoter,
        votePercentage: +votePercentage,
      });
    })
    .on("end", () => {
      if (!finished) return;
      colors.forEach((color) => {
        console.log(
          color,
          endingPercentages[color].filter((p) => p > 0).length
        );
      });
      console.table([[0, 0.05], [0.05, 0.1], [0.1, 0.2], [0.2, 0.3], [0.3, 0.4], [0.5, 0.75], [0.75, 1]].map(([min, max]) => {
        const percentages = distances.filter(({ distanceToMeanVoter }) => {
          return distanceToMeanVoter > min && distanceToMeanVoter < max;
        }).map(({ votePercentage }) => votePercentage)

        return { 
          range: `${min} - ${max}`,
          mean: utils.mean(percentages),
          median: utils.median(percentages)
        };
      }));
    });
  endStream.write(endCsv);
  endStream.end();
}

const data = fs.readdirSync('./data')
console.log(`Analyzing ${data.length} simulations`);
data.forEach((subdir, i) => {
  analyze(subdir, i === data.length - 1);
});

