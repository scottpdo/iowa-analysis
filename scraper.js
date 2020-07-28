const fs = require("fs");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { utils } = require("flocc");
const { exit } = require("process");
const url = "https://results.thecaucuses.org/";

function run(callback) {
  if (!fs.existsSync("./results.html")) {
    axios(url).then((res) => {
      fs.writeFileSync("./results.html", res.data);
      callback();
    });
  } else {
    callback();
  }
}

const percent = (n) => Math.round(10000 * n) / 100 + "%";

const CANDIDATES = [
  "bennet",
  "biden",
  "bloomberg",
  "buttigieg",
  "delaney",
  "gabbard",
  "klobuchar",
  "patrick",
  "sanders",
  "steyer",
  "warren",
  "yang",
];

const CANDIDATE_DATA = CANDIDATES.reduce((acc, cur) => {
  acc[cur] = {
    underdogs: 0,
    placed: 0,
    startTotal: 0,
    endTotal: 0,
    change: [],
    meanStartPercentOfTotal: [],
    meanStartPercentOfPlaced: [],
    meanEndPercent: [],
    SDE: 0,
  };
  return acc;
}, {});

const PRECINCT_DATA = {
  sizes: [],
  underdogs: [],
  placed: [],
};

run(function () {
  const html = fs.readFileSync("./results.html", "utf-8");
  const { document } = new JSDOM(html).window;
  const precinctData = Array.from(
    document.querySelectorAll(".precinct-data ul")
  );
  precinctData.forEach((precinct) => {
    const lis = Array.from(precinct.querySelectorAll("li")).map(
      (el) => el.innerHTML
    );
    const name = lis[0];
    if (name === "Total") return;
    const precinctResults = {
      bennet: lis.slice(1, 4),
      biden: lis.slice(4, 7),
      bloomberg: lis.slice(7, 10),
      buttigieg: lis.slice(10, 13),
      delaney: lis.slice(13, 16),
      gabbard: lis.slice(16, 19),
      klobuchar: lis.slice(19, 22),
      patrick: lis.slice(22, 25),
      sanders: lis.slice(25, 28),
      steyer: lis.slice(28, 31),
      warren: lis.slice(31, 34),
      yang: lis.slice(34, 37),
    };
    const startTotal = utils.sum(
      Object.values(precinctResults).map((c) => +c[0])
    );
    PRECINCT_DATA.sizes.push(startTotal);
    const endTotal = utils.sum(
      Object.values(precinctResults).map((c) => +c[1])
    );
    // if (startTotal > 800) console.log(name, startTotal, endTotal);
    const underdogs = CANDIDATES.reduce((total, candidate) => {
      const [start, end] = precinctResults[candidate].map((n) => +n);
      return start < 0.15 * startTotal && end >= 0.15 * endTotal && endTotal > 0
        ? total + 1
        : total;
    }, 0);
    PRECINCT_DATA.underdogs.push(underdogs);
    const placed = CANDIDATES.reduce((total, candidate) => {
      const [start, end] = precinctResults[candidate].map((n) => +n);
      return end >= 0.15 * endTotal && endTotal > 0 ? total + 1 : total;
    }, 0);
    if (endTotal < 50 && endTotal >= 20) PRECINCT_DATA.placed.push(placed);
    CANDIDATES.forEach((candidate) => {
      const [start, end, SDE] = precinctResults[candidate].map((n) => +n);
      // count as an underdog if they started below the 15% threshold but made it in the end
      // (and there were more than 0 votes total -- GRAHAM TOWNSHIP reported 0 at the end)
      if (start < 0.15 * startTotal && end >= 0.15 * endTotal && endTotal > 0) {
        CANDIDATE_DATA[candidate].underdogs++;
      }
      // same as above
      if (end >= 0.15 * endTotal && endTotal > 0) {
        CANDIDATE_DATA[candidate].placed++;
        CANDIDATE_DATA[candidate].meanEndPercent.push(end / endTotal);
        if (startTotal > 0) {
          CANDIDATE_DATA[candidate].meanStartPercentOfPlaced.push(
            start / startTotal
          );
        }
      }
      CANDIDATE_DATA[candidate].startTotal += start;
      CANDIDATE_DATA[candidate].endTotal += end;
      CANDIDATE_DATA[candidate].change.push(end - start);
      if (startTotal > 0) {
        CANDIDATE_DATA[candidate].meanStartPercentOfTotal.push(
          start / startTotal
        );
      }
      CANDIDATE_DATA[candidate].SDE += SDE;
    });
  });

  // log
  CANDIDATES.forEach((candidate) => {
    const data = CANDIDATE_DATA[candidate];
    data.placed = percent(data.placed / precinctData.length);
    data.underdogs = percent(data.underdogs / precinctData.length);
    data.meanStartPercentOfTotal = percent(
      utils.mean(data.meanStartPercentOfTotal)
    );
    data.meanStartPercentOfPlaced = percent(
      utils.mean(data.meanStartPercentOfPlaced)
    );
    data.meanEndPercent = percent(utils.mean(data.meanEndPercent));
    data.change = utils.mean(data.change);
    console.log(`${candidate}:`, data);
  });
  console.log(`Total # of precincts: ${precinctData.length}`);
  console.log(
    "Precinct size data",
    "Mean",
    utils.mean(PRECINCT_DATA.sizes),
    "Median",
    utils.median(PRECINCT_DATA.sizes),
    "Min",
    utils.min(PRECINCT_DATA.sizes),
    "Max",
    utils.max(PRECINCT_DATA.sizes)
  );
  console.log(
    "Precinct underdog data:",
    "Total",
    utils.sum(PRECINCT_DATA.underdogs),
    "Percent",
    percent(
      utils.sum(PRECINCT_DATA.underdogs) /
        (CANDIDATES.length * precinctData.length)
    )
  );
  console.log(
    "Precinct placed data:",
    "Total",
    utils.sum(PRECINCT_DATA.placed),
    "Mean # of placed",
    utils.mean(PRECINCT_DATA.placed)
  );
});
