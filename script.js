const URL = 'https://nowcasting-the-us-output-gap.herokuapp.com/gap-all-data/';

const concreteColour = "#0b789c",
      nowcastColour = "#EF8354",
      forecastColour = "#89b34a",
      recessionColour = "#DDDDDD",
      uncalledRecessionColour = "#f6eabe",
      graphDiv = "graph",
      outputGapText = "output_gap_text_under_data",
      viewportHorizontalMaxSizeMobile = 520;


function getAPIData(url) {
  const req = new XMLHttpRequest();
  return req.open("GET", url, true);
};

function getQuarter(val) {
  const q = val % 1;
  const dTrunc = {
    0: "Q1",
    0.25: "Q2",
    0.5: "Q3",
    0.75: "Q4"
  };
  return String(dTrunc[q]);
};


function getYearAndQuarter(val) {
  return String(~~val) + getQuarter(val);
};

function getQuarterFromMonth(month){
  if ([1, 2, 3].includes(parseInt(month))) return "Q1";
  if ([4, 5, 6].includes(parseInt(month))) return "Q2";
  if ([7, 8, 9].includes(parseInt(month))) return "Q3";
  if ([10, 11, 12].includes(parseInt(month))) return "Q4";
};

function writeTextBelowGraph(reqJSON){

  function isCurrentQuarter(conditionalForecastXval){
    const conditionalForecastQuarter = conditionalForecastXval % 1;
    const lastUpdateMonth = parseInt(reqJSON['latestRunUTC'].slice(5, 7));

    return (conditionalForecastQuarter == 0.0 && [1, 2, 3].includes(lastUpdateMonth)) || (conditionalForecastQuarter == 0.25 && [4, 5, 6].includes(lastUpdateMonth)) || 
            (conditionalForecastQuarter == 0.5 && [7, 8, 9].includes(lastUpdateMonth)) || (conditionalForecastQuarter == 0.75 && [10, 11, 12].includes(lastUpdateMonth));

  };
  
  const 
    cValList = Object.values(reqJSON['concreteObservations']),
    nValList = Object.values(reqJSON['nowcastForecastObservations']);

  const 
    concreteXVal = Object.keys(reqJSON['concreteObservations']),
    nowcastForcastXVal = Object.keys(reqJSON['nowcastForecastObservations']),
    lastQuarterOutputGap = Math.round(cValList[cValList.length-1]['gapPercentage'] * 10) / 10,
    nowcastGap = Math.round(nValList[0]['gapPercentage'] * 10) / 10,
    forecastGap = Math.round(nValList[1]['gapPercentage'] * 10) / 10,
    lastQuarterTypeIsIntitialRealised = (cValList[cValList.length-1]['isRealized'] === 'True'),
    nowcastGapIsIntitialRealised = (nValList[0]['isRealized'] === 'True');

  
  document.getElementById(outputGapText).innerHTML = 
      '<p>' + (isCurrentQuarter(nowcastForcastXVal[1]) ? `Output Gap ${getYearAndQuarter(nowcastForcastXVal[1])}: ${forecastGap}% (forecast)<br/>` : "") + 
      `Output Gap ${getYearAndQuarter(nowcastForcastXVal[0])}: ${nowcastGap}% ${nowcastGapIsIntitialRealised ? '(initial realized)' : "(nowcast)"}<br/>
      Output Gap ${getYearAndQuarter(concreteXVal[concreteXVal.length-1])}: ${lastQuarterOutputGap}% ${lastQuarterTypeIsIntitialRealised ? '(initial realized)' : ""}
      </p>`;

};

function graph(reqJSON) {

  document.getElementById("last_update").innerHTML = "Last updated (UTC): " + reqJSON['latestRunUTC'].slice(0, reqJSON['latestRunUTC'].length - 3);

  const 
    cValList = Object.values(reqJSON['concreteObservations']),
    nValList = Object.values(reqJSON['nowcastForecastObservations']);

  const 
    concreteYVal = [],
    nowcastForecastYVal = [];

  for (var i = 0; i < cValList.length; i++) {
    concreteYVal.push(round(cValList[i]['gapPercentage']));
  };

  for (var i = 0; i < nValList.length; i++) {
    nowcastForecastYVal.push(round(nValList[i]['gapPercentage']));
  };

  // necessary so that the estimates align with recessions and 
  //that the X axis for estimates now correspond with end of the quarter, not the start
  const rollForwardDatesByAQuarter = q => parseFloat(q) + 0.25;

  const 
    concreteXVal = Object.keys(reqJSON['concreteObservations']),
    nowcastForcastXVal = Object.keys(reqJSON['nowcastForecastObservations']),
    nowcastXVal = [nowcastForcastXVal[0]],
    nowcastYVal = [nowcastForecastYVal[0]],
    forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1)),
    forecastYVal = nowcastForecastYVal.slice(Math.max(nowcastForecastYVal.length - 5, 1)),
    concreteXValShiftedQuarters = concreteXVal.map(rollForwardDatesByAQuarter),
    nowcastForcastXValShiftedQuarters = nowcastForcastXVal.map(rollForwardDatesByAQuarter),
    forecastXValShiftedQuarters = forecastXVal.map(rollForwardDatesByAQuarter);


  yearQuarterText = Object.keys(reqJSON['concreteObservations']).map(getYearAndQuarter);

  const traceConcreteObs = {
    x: concreteXValShiftedQuarters,
    y: concreteYVal,
    mode: 'lines + markers',
    name: 'Realized Estimates',
    customdata: yearQuarterText,
    hovertemplate: "%{customdata}, %{y}",
    line: { color: concreteColour }
  };

  const traceNowcast = {
    x: nowcastForcastXValShiftedQuarters,
    y: nowcastYVal,
    mode: 'lines + markers',
    name: 'Nowcast',
    customdata: nowcastXVal.map(getYearAndQuarter),
    hovertemplate: "%{customdata}, %{y}",
    line: { color: nowcastColour }
  };

  const traceForecast = {
    x: forecastXValShiftedQuarters,
    y: forecastYVal,
    mode: 'lines + markers',
    name: 'Conditional Forecasts',
    customdata: forecastXVal.map(getYearAndQuarter),
    hovertemplate: "%{customdata}, %{y}",
    visible: "legendonly",
    line: { color: forecastColour }
  };

  const layout = {
    font: { size: window.screen.width < viewportHorizontalMaxSizeMobile ? 30 : 13 },
    autosize: true,
    height: window.screen.width < viewportHorizontalMaxSizeMobile ? 650 : 500 ,
    shapes: [
      {
        type: 'line',
        x0: concreteXValShiftedQuarters[concreteXVal.length - 1],
        y0: concreteYVal[concreteYVal.length - 1],
        x1: nowcastForcastXValShiftedQuarters[0],
        y1: nowcastYVal[0],
        visible: true,
        line: {
          color: nowcastColour,
          width: 2,
        }
      },
      {
        type: 'line',
        x0: nowcastForcastXValShiftedQuarters[0],
        y0: nowcastYVal[0],
        x1: forecastXValShiftedQuarters[0],
        y1: forecastYVal[0],
        visible: false,
        line: {
          color: forecastColour,
          width: 2,
        }
      }
    ],
    margin: { 'l': 30, 'r': 10, 't': 25, 'b': 20 },
    yaxis: {
      ticksuffix: "%",
      automargin: true
    },
    xaxis: {
      showgrid: false,
      automargin: true
    },
    legend: {
      orientation: "h",
      yanchor: "top",
      y:  window.screen.width < viewportHorizontalMaxSizeMobile ? 1.18 : 1.03,
      xanchor: "right",
      x: 1.03,
    }
  };

  reqJSON.recessions.forEach(recessionPeriod => {
    const 
      recCol = recessionPeriod.troughDate == "None" ? uncalledRecessionColour : recessionColour,
      troughDate = recessionPeriod.troughDate == "None" ? forecastXVal[forecastXVal.length - 1] : recessionPeriod.troughDate;

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
    });});

  const data = [traceConcreteObs, traceNowcast, traceForecast];

  Plotly.newPlot(graphDiv, data, layout);

};

const req = new XMLHttpRequest();
req.open("GET", URL, true);
req.timeout = 8000;

req.onload = function () {
  const fig = document.getElementById(graphDiv);
  if (this.status == 200){
    fig.innerHTML = '';
    const reqJSON =  JSON.parse(req.responseText);
    
    graph(reqJSON);

    fig.on('plotly_legenddoubleclick', () => false);

    fig.on('plotly_legendclick', (clickData) => {
      const curvNum = clickData.curveNumber;
      if (curvNum == 0 || curvNum == 1) return false;

      if ([1, 2].includes(curvNum)) {
        const update = {};
        update["shapes[" + String(curvNum - 1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly' ? true : false;

        Plotly.relayout(graphDiv, update);
      };

    });

    writeTextBelowGraph(reqJSON)

    buildMonthlyIndicatorsTable(reqJSON.last4MonthsTable);

    buildHistoricNowcastsTable(reqJSON.historicalNowcasts);

    if (window.screen.width < viewportHorizontalMaxSizeMobile) document.getElementById("twitter_button").setAttribute("data-size", "large");

  } else { fig.innerHTML = '<br><br><br><br><b>Site momentarily undergoing maintenance. Please come back later.</b><br><br><br><br>'; };
};

req.send(null);


function onResize() {
  graph(JSON.parse(req.responseText));
};


const 
  dataCollapsible = document.getElementsByClassName("collapsible"),
  dataCollapsibleArrow = document.getElementsByClassName("arrow");

for (var idx = 0; idx < dataCollapsible.length; idx++) {
  (function(idx){
    dataCollapsible[idx].addEventListener("click", function () {
      this.classList.toggle("active");
      dataCollapsibleArrow[idx].classList.toggle("down");
      const content = this.nextElementSibling;
      content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
    });
  })(idx);
};


function round(value) {
  function countDecimals(val) {
    if(Math.floor(val) === val) return 0;
    return val.toString().split(".")[1].length || 0;
    };
  if (value == "None") return "-";
  if (countDecimals(value) <=2) return value;
  return parseFloat(value).toFixed(2);
};

function roundSpecial(value, isTo1DP=false) {
  function countDecimals(val) {
    if(Math.floor(val) === val) return 0;
    return val.toString().split(".")[1].length || 0;
    };
  if (value == "None") return "-";

  if (isTo1DP && countDecimals(value) <=2) return parseFloat(value).toFixed(1);

  return parseFloat(value).toFixed(2);
};

const MONTH = {
  "01": "Jan.",
  "02": "Feb.",
  "03": "Mar.",
  "04": "Apr.",
  "05": "May.",
  "06": "Jun.",
  "07": "Jul.",
  "08": "Aug.",
  "09": "Sept.",
  "10": "Oct.",
  "11": "Nov.",
  "12": "Dec.",
};

function buildMonthlyIndicatorsTable(dataDict) {

  const 
    keyArray = [],
    dataArray = [],
    monthlyIndicatorsTable = document.getElementById('monthlyIndicatorsTable');

  for (const key in dataDict) {
    keyArray.push(key);
    dataArray.push(dataDict[key]);
  };

  const titles = ["Federal funds rate (%)", "Term spread (%)", "Risk spread (%)", "Stock returns (%)",
    "Consumer sentiment (indx.)", "Unemployment rate (%)", "Monthly CPI Inflation (%)", "IP growth (%)", "Housing starts growth (%)"];
  const dictKeys = ["FEDFUNDS", "TERMSPREAD", "RISKSPREAD", "SP500PERC", "UMCSENT", "UNRATE", "CPIAUCSLPERC", "INDPROPERC", "HOUSTPERC"];

  var horizontalHeader = "<tr><th></th>";
  for (const key of keyArray) {
    horizontalHeader += "<th>" + MONTH[key.slice(-2)] + "</th>";
  };

  horizontalHeader += "</tr><tr>";
  monthlyIndicatorsTable.innerHTML += horizontalHeader;

  for (var k = 0; k < dictKeys.length; k++) {
    var row = `<tr><th>${titles[k]}</th>`;
    for (var i = 0; i < dataArray.length; i++) {
      row += `<td>${roundSpecial(dataArray[i][dictKeys[k]], (dictKeys[k] == "UNRATE" || dictKeys[k] == "UMCSENT"))}</td>`;
    };
    row += "</tr>";
    monthlyIndicatorsTable.innerHTML += row;
  };
};

function buildHistoricNowcastsTable(dataDict) {
  function getCondensedDate(date) {
    const day = date.slice(-2);
    const month = date.slice(-5, -3);
    return `${day}-${MONTH[month]}`;
  };

  const 
    keyArray = [],
    dataArray = [],
    historicalNowcastsTable = document.getElementById('historicalNowcastsTable');

  for (const key in dataDict.observations) {
    keyArray.push(key);
    dataArray.push(dataDict.observations[key]);
  };

  if (keyArray.length <= 0) return null;

  const lengthOfRow = 30; // no more than 30 rows displays nicely
  const numberOfColumns = Math.ceil(keyArray.length / lengthOfRow)

  historicalNowcastsTable.innerHTML += `<tr><th colspan=${numberOfColumns * 2}>Historical Nowcasts ${getYearAndQuarter(dataDict.latestRunUTC)}</th></tr>`;

  var isIndexOutOfBounds = false;
  for (var r = 0; r < lengthOfRow; r++){
    var row = "";
    for (var c = 1; c <= numberOfColumns; c++){
      if (r*c >= keyArray.length) {isIndexOutOfBounds = true; break;}
      row += `<td><b>${(getCondensedDate(keyArray[r*c]))}</b></td><td>${round(dataArray[r*c].gapPercentage)} |</td>`;
    };
    historicalNowcastsTable.innerHTML += "<tr>" + row + "</tr>";
    if (isIndexOutOfBounds) break;
  };

};

;