const STARTS_WITH_SIGN = /^[+-].+/;

const button = document.querySelector("#button");
const resultsDiv = document.querySelector("#results")!;

const pickerOpts = {
  types: [
    {
      description: "txt",
      accept: {
        "other/*": [".txt"],
      },
    },
  ],
  excludeAcceptAllOption: true,
  multiple: false,
};

async function getTheFile() {
  // open file picker
  // @ts-ignore: Unreachable code error
  const [fileHandle] = await window.showOpenFilePicker(pickerOpts);
  // get file contents
  // @ts-ignore: Unreachable code error
  const fileData = await fileHandle.getFile();
  const text: string = await fileData.text();
  const lines = text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  main(lines);
}

const getMatrix = (input: string[]) => {
  const height = +input?.[0];
  const width = +input?.[1];
  const matrix = input
    .filter((line) => !STARTS_WITH_SIGN.test(line) && line.length > 1)
    .map((line) => {
      const lineCols = line.split(" ");
      const label = lineCols.shift();
      const values = lineCols.map((val) => +val);

      return { values, label };
    });

  if (matrix.length !== height) {
    throw "wysokość macierzy nie zgadza się z tą zadeklarowaną";
  }

  if (matrix.some((row) => row.values.length !== width)) {
    throw "szerokość macierzy nie zgadza się z tą zadeklarowaną";
  }

  matrix.forEach((row) => {
    row.values.forEach((value) => {
      if (isNaN(value)) {
        throw "jedna z wartości nie jest poprawną liczbą";
      }
    });
  });

  return matrix;
};

const getCriteria = (input: string[]) => {
  const criteria = input
    .filter((line) => STARTS_WITH_SIGN.test(line))
    .map((line, lineIndex) => {
      const [sign, label, wght, ...plotPts] = line.split(" ");
      if (sign !== "+" && sign !== "-") {
        throw new Error("linie z kryteriami powinny zaczynać się od + lub -");
      }
      const weight = +wght;

      const plotPoints = plotPts.map((point) => {
        const pointXY = point.slice(1, point.length - 1);

        const values = pointXY.split(",").map((value) => +value) as [
          number,
          number
        ];
        return values;
      });

      plotPoints.forEach((point, index, array) => {
        if (index !== 0) {
          if (
            (sign === "-" && array[index - 1][1] <= point[1]) ||
            (sign === "+" && array[index - 1][1] >= point[1])
          ) {
            throw new Error(
              "kryterium typu " +
                sign +
                " numer " +
                (lineIndex + 1) +
                " nie posiada prawidłowych wartości y dla (x,y)"
            );
          }
          if (array[index - 1][0] >= point[0]) {
            throw new Error(
              "kryterium typu " +
                sign +
                " numer " +
                (lineIndex + 1) +
                " nie posiada prawidłowych wartości x dla (x,y)"
            );
          }
        }
      });
      return { weight, label, plotPoints };
    });

  const weightsSum = criteria.reduce((prev, current) => {
    return current.weight + prev;
  }, 0);

  if (weightsSum !== 1) {
    throw new Error("suma wag nie równa się 1");
  }

  return criteria;
};

const getYValue = (
  xValue: number,
  criterium: { label: string; weight: number; plotPoints: [number, number][] }
) => {
  for (let i = 1; i < criterium.plotPoints.length; i++) {
    if (xValue <= criterium.plotPoints[i][0]) {
      const xDistance =
        criterium.plotPoints[i][0] - criterium.plotPoints[i - 1][0];
      const yDistance =
        criterium.plotPoints[i][1] - criterium.plotPoints[i - 1][1];
      const xDelta = criterium.plotPoints[i][0] - xValue;

      const yDelta = (xDelta / xDistance) * yDistance;
      const yValue = criterium.plotPoints[i][1] - yDelta;
      return yValue;
    }
  }
};

const main = (input: string[]) => {
  console.log(input);
  const matrix = getMatrix(input);
  console.log(matrix);
  const criteria = getCriteria(input);
  console.log(criteria);
  const ranking = matrix.map((row, index) => {
    const value = row.values
      .map((xValue, index) => {
        return (
          (getYValue(xValue, criteria[index]) || 0) * criteria[index].weight
        );
      })
      .reduce((prev, current) => {
        return (prev || 0) + (current || 0);
      }, 0);

    return { label: row.label, value };
  });

  console.log(ranking);
  ranking.sort((a, b) => b.value - a.value);

  let resultHTML = "";
  for (let i = 0; i < ranking.length; i++) {
    if (i === 0 || ranking[i].value !== ranking[i - 1].value) {
      resultHTML += "</br>";
    }
    resultHTML += `${ranking[i].label}: ${ranking[i].value}, `;
  }
  resultsDiv.innerHTML += resultHTML;
};

button?.addEventListener("click", (e) => {
  getTheFile();
});
export {};
