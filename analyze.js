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

let victors = [];
const distances = [];

function analyze(n) {
  const startCsv = fs.readFileSync(
    `./data/${utils.zfill(n.toString(), 4)}/001.csv`,
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
      `./data/${utils.zfill(n.toString(), 4)}/${utils.zfill(
        i.toString(),
        3
      )}.csv`
    )
  ) {
    i++;
  }
  i--;
  // console.log(i);
  endCsv = fs.readFileSync(
    `./data/${utils.zfill(n.toString(), 4)}/${utils.zfill(
      i.toString(),
      3
    )}.csv`,
    "utf-8"
  );
  const endStream = parse({
    headers: true,
  })
    .on("error", (error) => console.error(error))
    .on("data", ({ color, votes, votePercentage, distanceToMeanVoter }) => {
      endingPercentages[color].push(+votePercentage);
      if (victors.length === n - 1) {
        victors.push(0);
      }
      if (votePercentage > 0) victors[n - 1]++;

      distances.push({
        distanceToMeanVoter: +distanceToMeanVoter,
        votePercentage: +votePercentage,
      });
    })
    .on("end", () => {
      if (n !== 99) return;
      colors.forEach((color) => {
        console.log(
          color,
          endingPercentages[color].filter((p) => p > 0).length
        );
      });
      console.log(
        "0 - 0.05",
        utils.mean(
          distances
            .filter(({ distanceToMeanVoter }) => distanceToMeanVoter < 0.05)
            .map(({ votePercentage }) => votePercentage)
        )
      );
      console.log(
        "0.05 - 0.1",
        utils.mean(
          distances
            .filter(
              ({ distanceToMeanVoter }) =>
                distanceToMeanVoter < 0.1 && distanceToMeanVoter > 0.05
            )
            .map(({ votePercentage }) => votePercentage)
        )
      );
      console.log(
        "0.1 - 0.2",
        utils.mean(
          distances
            .filter(
              ({ distanceToMeanVoter }) =>
                distanceToMeanVoter < 0.2 && distanceToMeanVoter > 0.1
            )
            .map(({ votePercentage }) => votePercentage)
        )
      );
      console.log(
        "0.2 - 0.3",
        utils.mean(
          distances
            .filter(
              ({ distanceToMeanVoter }) =>
                distanceToMeanVoter < 0.3 && distanceToMeanVoter > 0.2
            )
            .map(({ votePercentage }) => votePercentage)
        )
      );
      console.log(
        "0.3 - 0.4",
        utils.mean(
          distances
            .filter(
              ({ distanceToMeanVoter }) =>
                distanceToMeanVoter < 0.4 && distanceToMeanVoter > 0.3
            )
            .map(({ votePercentage }) => votePercentage)
        )
      );
      console.log(
        "0.4 - 0.5",
        utils.mean(
          distances
            .filter(
              ({ distanceToMeanVoter }) =>
                distanceToMeanVoter < 0.5 && distanceToMeanVoter > 0.4
            )
            .map(({ votePercentage }) => votePercentage)
        )
      );
    });
  endStream.write(endCsv);
  endStream.end();
}

for (let n = 0; n < 500; n++) {
  analyze(n);
}
