const fs = require("fs");
const { parse } = require("papaparse");

export function parseDashboardCSV(filePath, options) {
  const fileContent = fs.readFileSync(filePath, "utf8");

  const parsedData = parse(fileContent, {
    header: false,
    skipEmptyLines: false,
  }).data;

  const metadata = extractMetadata(parsedData, options);

  const widgetSections = findWidgetSections(parsedData, options);

  const widgets = widgetSections.map((sectionStart, index) => {
    const sectionEnd =
      index < widgetSections.length - 1
        ? widgetSections[index + 1]
        : parsedData.length;

    return extractWidgetData(parsedData, sectionStart, sectionEnd);
  });

  return {
    metadata,
    widgets,
  };
}

function findWidgetSections(data, options) {
  const widgetSections = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === options.reportName) {
      widgetSections.push(i);
    }
  }

  return widgetSections;
}

function extractMetadata(data, options) {
  const metadata = {};

  let endRow = 0;
  while (endRow < data.length) {
    if (data[endRow][0] === options.reportName) {
      break;
    }
    endRow++;
  }

  for (let i = 0; i < endRow; i++) {
    const row = data[i];
    if (row[0] && row[0] !== "") {
      metadata[row[0]] = row[1];
    }
  }

  return metadata;
}

function extractWidgetData(data, startRow, endRow) {
  const widget = {
    name: data[startRow][1],
    metadata: {},
    reports: [],
  };

  let currentRow = startRow + 1;

  while (currentRow < endRow) {
    const row = data[currentRow];

    if (row[0] === "" && row[1] !== "" && row[1] !== undefined) {
      widget.reports.push(row);
    }

    if (row[0] && row[0] !== "") {
      const dataset = row.slice(1).filter((v) => v);
      if (dataset.length === 1) {
        widget.metadata[row[0]] = dataset[0];
      } else {
        widget.reports.push(row);
      }
    }

    currentRow++;
  }

  return widget;
}

export function saveDashboardToJSON(dashboardData, outputFilePath) {
  try {
    fs.writeFileSync(outputFilePath, JSON.stringify(dashboardData, null, 2));
    console.log(`Dashboard data saved to ${outputFilePath}`);
  } catch (error) {
    console.error("Error saving dashboard data:", error);
    throw error;
  }
}
