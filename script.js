gapUrl = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap/?type=json';
last4MonthsForNowcastUrl = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/monthly-last-4-months-used-in-nowcast/?type=json';
concreteColour = "#0b789c";
nowcastColour = "#EF8354";
forecastColour = "#89b34a";
recessionColour = "#DDDDDD";
graphDiv = "graph";


function getAPIData(url) {
  var req = new XMLHttpRequest();
  return req.open("GET", url, true);
}

function getYearAndQuarter(val) {
  q = val % 1
  d = {
    0: "Q1",
    0.25: "Q2",
    0.5: "Q3",
    0.75: "Q4"
  };
  return String(~~val) + " " + String(d[q]);
}

function graph(gapDict) {

  document.getElementById("last_update").innerHTML = "Latest update (UTC): " + String(gapDict['latestRunUTC']);

  cValList = Object.values(gapDict['concreteObservations']);
  nValList = Object.values(gapDict['nowcastForecastObservations']);

  concreteYVal = [];

  for (var i = 0; i < cValList.length; i++) {
    concreteYVal.push(cValList[i]['gapPercentage']);
  }

  nowcastForecastYVal = [];

  for (var i = 0; i < nValList.length; i++) {
    nowcastForecastYVal.push(nValList[i]['gapPercentage']);
  }

  concreteXVal = Object.keys(gapDict['concreteObservations']);
  nowcastForcastXVal = Object.keys(gapDict['nowcastForecastObservations']);
  nowcastXVal = [nowcastForcastXVal[0]];
  nowcastYVal = [nowcastForecastYVal[0]];
  forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1));
  forecastYVal = nowcastForecastYVal.slice(Math.max(nowcastForecastYVal.length - 5, 1));

  yearQuarterText = Object.keys(gapDict['concreteObservations']).map(getYearAndQuarter);

  var traceConcreteObs = {
    x: concreteXVal,
    y: concreteYVal,
    mode: 'lines + markers',
    name: 'Concrete Estimates',
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
    name: 'Conditional Forecast',
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

  recessions.forEach(recessionPeriod => layout['shapes'].push(
    {
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: recessionPeriod[0],
      y0: 0,
      x1: recessionPeriod[1],
      y1: 1,
      fillcolor: recessionColour,
      opacity: 0.2,
      line: {
        width: 0
      }
    }));

  const data = [traceConcreteObs, traceNowcast, traceForecast];

  Plotly.newPlot(graphDiv, data, layout);

}

var gapreq = new XMLHttpRequest();
gapreq.open("GET", gapUrl, true);
gapreq.timeout = 3000;

gapreq.onload = function () {
  if (this.status == 200){
    const gapDict =  JSON.parse(gapreq.responseText);
    graph(gapDict);
    
    const fig = document.getElementById(graphDiv)

    fig.on('plotly_legenddoubleclick', () => false);

    fig.on('plotly_legendclick', (clickData) => {
      const curvNum = clickData.curveNumber;

      if ([1, 2].includes(curvNum)) {
        var update = {};
        update["shapes[" + String(curvNum - 1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly' ? true : false;

        Plotly.relayout(graphDiv, update);
      }

    });
  }
};

gapreq.send(null);



function onResize() {
  graph(JSON.parse(gapreq.responseText));
}




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
    }
  });
}

var l4Mreq = new XMLHttpRequest();
l4Mreq.open("GET", last4MonthsForNowcastUrl, true);

l4Mreq.timeout = 3000;

l4Mreq.onload = function () {
  if (this.status == 200){
  const last4MonthsDict = JSON.parse(l4Mreq.responseText);
  buildTable(last4MonthsDict)
  }
};

l4Mreq.send(null);



function round(val) {
  if (val == "None") { return "-" }
  return Math.round(val * 100) / 100
}

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
  var dataArray = [];
  var keyArray = [];
  for (var key in dataDict["observations"]) {
    keyArray.push(key);
    dataArray.push(dataDict["observations"][key]);
  }

  titles = ["Federal funds rate (%)", "Term spread (%)", "Risk spread (%)", "Stock returns (%)",
    "Consumer sentiment (indx.)", "Unemployment rate (%)", "Monthly CPI Inflation (%)", "IP growth (%)", "Housing starts growth (%)"];
  dictKeys = ["FEDFUNDS", "TERMSPREAD", "RISKSPREAD", "SP500PERC", "UMCSENT", "UNRATE", "CPIAUCSLPERC", "INDPROPERC", "HOUSTPERC"];

  var horizontalHeader = "<tr><th> </th>";
  for (const key of keyArray) {
    horizontalHeader += "<th>" + month[key.slice(-2)] + "</th>";
  }

  horizontalHeader += "</tr><tr>";
  last4monthsTable.innerHTML += horizontalHeader;

  for (var k = 0; k < dictKeys.length; k++) {
    row = `<tr><th> ${titles[k]} </th>`;
    for (var i = 0; i < dataArray.length; i++) {
      row += `<td>${round(dataArray[i][dictKeys[k]])}</td>`;
    }
    row += "</tr>";
    last4monthsTable.innerHTML += row;
  }
}