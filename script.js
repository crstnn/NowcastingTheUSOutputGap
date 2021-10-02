const URL = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap-all-data/';

const concreteColour = "#0b789c";
const nowcastColour = "#EF8354";
const forecastColour = "#89b34a";
const recessionColour = "#DDDDDD";
const uncalledRecessionColour = "#f6eabe";
const graphDiv = "graph";
const outputGapText = "output_gap_text_under_data";


function getAPIData(url) {
  var req = new XMLHttpRequest();
  return req.open("GET", url, true);
};

function getQuarter(val, isTruncated=true) {
  q = val % 1;
  dTrunc = {
    0: "Q1",
    0.25: "Q2",
    0.5: "Q3",
    0.75: "Q4"
  };
  d = {
    0: "1" + "st".sup() + " Quarter",
    0.25: "2" + "nd".sup() + " Quarter",
    0.5: "3" + "rd".sup() + " Quarter",
    0.75: "4" + "th".sup() + " Quarter"
  };
  return String(isTruncated ? dTrunc[q] : d[q]);
};


function getYearAndQuarter(val) {
  return String(~~val) + " " + getQuarter(val);
};

const zip = (a, b) => a.map((key, idx) => [key, b[idx]]);

function writeTextBelowGraph2(reqJSON){
  // perhaps for future version OBSOLETE FOR NOW
  const obsDictCombined = Object.assign({}, reqJSON['concreteObservations'], reqJSON['nowcastForecastObservations']);

  const obsToDisplay = zip(Object.keys(obsDictCombined), Object.values(obsDictCombined)).filter(o => Boolean(o[1]["isToBeDisplayed"]));
  // post-condition of GET request, only ever 2 obs to display. We will just display the first two if this no longer holds

  const
    quarterToDisplay1 = Math.round(obsToDisplay[0][1]['gapPercentage'] * 10) / 10,
    quarterToDisplay2 = Math.round(obsToDisplay[1][1]['gapPercentage'] * 10) / 10,
    lastQuarterTypeIsIntitialRealised = Boolean(obsToDisplay[0][1]['isRealized']),
    nowcastGapIsIntitialRealised = Boolean(obsToDisplay[1][1]['isRealized']);

  const outputGapTextDiv = document.getElementById(outputGapText);
  outputGapTextDiv.innerHTML = `<p>
                                  ${getQuarter(obsToDisplay[0][0], false)} 
                                  Output Gap: ${quarterToDisplay1} ${lastQuarterTypeIsIntitialRealised ? '(initial realized)' : ""}<br/>
                                  ${getQuarter(obsToDisplay[1][0], false)} 
                                  Output Gap: ${quarterToDisplay2} ${nowcastGapIsIntitialRealised ? '(initial realized)' : ""}
                                  </p>`;

};

function writeTextBelowGraph(reqJSON){

  const cValList = Object.values(reqJSON['concreteObservations']);
  const nValList = Object.values(reqJSON['nowcastForecastObservations']);

  const 
    concreteXVal = Object.keys(reqJSON['concreteObservations']),
    nowcastForcastXVal = Object.keys(reqJSON['nowcastForecastObservations']),
    lastQuarterOutputGap = Math.round(cValList[cValList.length-1]['gapPercentage'] * 10) / 10,
    nowcastGap = Math.round(nValList[0]['gapPercentage'] * 10) / 10,
    forecastGap = Math.round(nValList[1]['gapPercentage'] * 10) / 10,
    lastQuarterTypeIsIntitialRealised = Boolean(cValList[cValList.length-1]['isRealized']),
    nowcastGapIsIntitialRealised = Boolean(nValList[0]['isRealized']);

  const outputGapTextDiv = document.getElementById(outputGapText);
  outputGapTextDiv.innerHTML = `<p>
                                  Output Gap ${getYearAndQuarter(nowcastForcastXVal[1])}: ${forecastGap}% (forecast)<br/>
                                  Output Gap ${getYearAndQuarter(nowcastForcastXVal[0])}: ${nowcastGap}% ${nowcastGapIsIntitialRealised ? '(initial realized)' : ""}<br/>
                                  Output Gap ${getYearAndQuarter(concreteXVal[concreteXVal.length-1])}: ${lastQuarterOutputGap}% ${lastQuarterTypeIsIntitialRealised ? '(initial realized)' : ""}
                                  </p>`;

};

function graph(reqJSON) {

  document.getElementById("last_update").innerHTML = "Latest update (UTC): " + String(reqJSON['latestRunUTC']);

  const cValList = Object.values(reqJSON['concreteObservations']);
  const nValList = Object.values(reqJSON['nowcastForecastObservations']);

  const concreteYVal = [];

  for (var i = 0; i < cValList.length; i++) {
    concreteYVal.push(round(cValList[i]['gapPercentage']));
  }

  const nowcastForecastYVal = [];

  for (var i = 0; i < nValList.length; i++) {
    nowcastForecastYVal.push(round(nValList[i]['gapPercentage']));
  }

  const 
    concreteXVal = Object.keys(reqJSON['concreteObservations']),
    nowcastForcastXVal = Object.keys(reqJSON['nowcastForecastObservations']),
    nowcastXVal = [nowcastForcastXVal[0]],
    nowcastYVal = [nowcastForecastYVal[0]],
    forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1)),
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
  const fig = document.getElementById(graphDiv);
  if (this.status == 200){
    fig.innerHTML = '';
    var reqJSON =  JSON.parse(req.responseText);
    graph(reqJSON);

    fig.on('plotly_legenddoubleclick', () => false);

    fig.on('plotly_legendclick', (clickData) => {
      const curvNum = clickData.curveNumber;

      if ([1, 2].includes(curvNum)) {
        var update = {};
        update["shapes[" + String(curvNum - 1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly' ? true : false;

        Plotly.relayout(graphDiv, update);
      };

    });

    writeTextBelowGraph(reqJSON)

    buildTable(reqJSON.last4MonthsTable);

  } else { fig.innerHTML = '<b>Site undergoing maintenance. Please come back later.</b></br>'; };
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


function round(value) {
  function countDecimals(val) {
    if(Math.floor(val) === val) return 0;
    return val.toString().split(".")[1].length || 0;
    }
  if (value == "None") return "-";
  if (countDecimals(value) <=2) return value;
  return parseFloat(value).toFixed(2);
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
