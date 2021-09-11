const URL = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap-all-data/';

const concreteColour = "#0b789c";
const nowcastColour = "#EF8354";
const forecastColour = "#89b34a";
const recessionColour = "#DDDDDD";
const uncalledRecessionColour = "#f6eabe";
const graphDiv = "graph";


function getAPIData(url) {
  var req = new XMLHttpRequest();
  return req.open("GET", url, true);
}


function getYearAndQuarter(val) {
  q = val % 1;
  d = {
    0: "Q1",
    0.25: "Q2",
    0.5: "Q3",
    0.75: "Q4"
  };
  return String(~~val) + " " + String(d[q]);
}

function graph(reqJSON) {

  document.getElementById("last_update").innerHTML = "Latest update (UTC): " + String(reqJSON['latestRunUTC']);

  cValList = Object.values(reqJSON['concreteObservations']);
  nValList = Object.values(reqJSON['nowcastForecastObservations']);

  concreteYVal = [];

  for (var i = 0; i < cValList.length; i++) {
    concreteYVal.push(cValList[i]['gapPercentage']);
  }

  nowcastForecastYVal = [];

  for (var i = 0; i < nValList.length; i++) {
    nowcastForecastYVal.push(nValList[i]['gapPercentage']);
  }

  concreteXVal = Object.keys(reqJSON['concreteObservations']);
  nowcastForcastXVal = Object.keys(reqJSON['nowcastForecastObservations']);
  nowcastXVal = [nowcastForcastXVal[0]];
  nowcastYVal = [nowcastForecastYVal[0]];
  forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1));
  forecastYVal = nowcastForecastYVal.slice(Math.max(nowcastForecastYVal.length - 5, 1));

  yearQuarterText = Object.keys(reqJSON['concreteObservations']).map(getYearAndQuarter);

  var traceConcreteObs = {
    x: concreteXVal,
    y: concreteYVal,
    mode: 'lines + markers',
    name: 'Realized Estimates',
    customdata: yearQuarterText,
    hovertemplate: "%{customdata}, %{y}",
    line: { color: concreteColour }
  };

  var traceNowcast = {
    x: nowcastXVal,
    y: nowcastYVal,
    mode: 'lines + markers',
    name: 'Nowcast',
    customdata: nowcastXVal.map(getYearAndQuarter),
    hovertemplate: "%{customdata}, %{y}",
    line: { color: nowcastColour }
  };

  var traceForecast = {
    x: forecastXVal,
    y: forecastYVal,
    mode: 'lines + markers',
    name: 'Conditional Forecasts',
    customdata: forecastXVal.map(getYearAndQuarter),
    hovertemplate: "%{customdata}, %{y}",
    visible: "legendonly",
    line: { color: forecastColour }
  };

  var layout = {
    autosize: true,
    shapes: [
      {
        type: 'line',
        x0: concreteXVal[concreteXVal.length - 1],
        y0: concreteYVal[concreteYVal.length - 1],
        x1: nowcastXVal[0],
        y1: nowcastYVal[0],
        visible: true,
        line: {
          color: nowcastColour,
          width: 2,
        }
      },
      {
        type: 'line',
        x0: nowcastXVal[0],
        y0: nowcastYVal[0],
        x1: forecastXVal[0],
        y1: forecastYVal[0],
        visible: false,
        line: {
          color: forecastColour,
          width: 2,
        }
      }
    ],
    margin: { 'l': 35, 'r': 30, 't': 30, 'b': 30 },
    yaxis: {
      ticksuffix: "%"
    },
    xaxis: {
      showgrid: false
    },
    legend: {
      orientation: "h",
      yanchor: "top",
      y: 1.03,
      xanchor: "right",
      x: 1
    }
  };

  reqJSON.recessions.forEach(recessionPeriod => {
    const recCol = recessionPeriod.troughDate == "None" ? uncalledRecessionColour : recessionColour;
    const troughDate = recessionPeriod.troughDate == "None" ? forecastXVal[forecastXVal.length - 1] : recessionPeriod.troughDate;
    layout['shapes'].push(
    {
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: recessionPeriod.peakDate,
      y0: 0,
      x1: troughDate,
      y1: 1,
      fillcolor: recCol,
      opacity: 0.2,
      line: {
        width: 0
      }
    })});

  const data = [traceConcreteObs, traceNowcast, traceForecast];

  Plotly.newPlot(graphDiv, data, layout);

};

var req = new XMLHttpRequest();
req.open("GET", URL, true);
req.timeout = 8000;

req.onload = function () {
  if (this.status == 200){
    var reqJSON =  JSON.parse(req.responseText);
    graph(reqJSON);
    
    const fig = document.getElementById(graphDiv);

    fig.on('plotly_legenddoubleclick', () => false);

    fig.on('plotly_legendclick', (clickData) => {
      const curvNum = clickData.curveNumber;

      if ([1, 2].includes(curvNum)) {
        var update = {};
        update["shapes[" + String(curvNum - 1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly' ? true : false;

        Plotly.relayout(graphDiv, update);
      };

    });

    buildTable(reqJSON.last4MonthsTable);

  };
};

req.send(null);


function onResize() {
  graph(JSON.parse(req.responseText));
};


const dataCollapsible = document.getElementsByClassName("collapsible");
const dataCollapsibleArrow = document.getElementById("arrow");

for (var i = 0; i < dataCollapsible.length; i++) {
  dataCollapsible[i].addEventListener("click", function () {
    this.classList.toggle("active");
    dataCollapsibleArrow.classList.toggle("down");
    var content = this.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    };
  });
};


function round(val) {
  if (val == "None") { return "-" };
  return Math.round(val * 100) / 100;
};

function buildTable(dataDict) {
  month = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  const last4monthsTable = document.getElementById('dataTable');
  let dataArray = [];
  let keyArray = [];
  for (let key in dataDict) {
    keyArray.push(key);
    dataArray.push(dataDict[key]);
  };

  titles = ["Federal funds rate (%)", "Term spread (%)", "Risk spread (%)", "Stock returns (%)",
    "Consumer sentiment (indx.)", "Unemployment rate (%)", "Monthly CPI Inflation (%)", "IP growth (%)", "Housing starts growth (%)"];
  dictKeys = ["FEDFUNDS", "TERMSPREAD", "RISKSPREAD", "SP500PERC", "UMCSENT", "UNRATE", "CPIAUCSLPERC", "INDPROPERC", "HOUSTPERC"];

  let horizontalHeader = "<tr><th> </th>";
  for (const key of keyArray) {
    horizontalHeader += "<th>" + month[key.slice(-2)] + "</th>";
  };

  horizontalHeader += "</tr><tr>";
  last4monthsTable.innerHTML += horizontalHeader;

  for (var k = 0; k < dictKeys.length; k++) {
    let row = `<tr><th> ${titles[k]} </th>`;
    for (var i = 0; i < dataArray.length; i++) {
      row += `<td>${round(dataArray[i][dictKeys[k]])}</td>`;
    };
    row += "</tr>";
    last4monthsTable.innerHTML += row;
  };
};

;
