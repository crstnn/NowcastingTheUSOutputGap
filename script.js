const gapDataURL = 'https://nowcasting-the-us-output-gap.herokuapp.com/gap-all-data/?type=json';
const quarterlyDataURL = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/quarterly/?type=json';
const last4MontlyIndicatorsDataURL = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/monthly-indicators-last-4-months/?type=json';
const historicalNowcastsDataURL = 'https://nowcasting-the-us-output-gap.herokuapp.com/historical-data/gap/?type=json';

const 
      concreteColour = "#0b789c",
      nowcastColour = "#EF8354",
      forecastColour = "#89b34a",
      recessionColour = "#DDDDDD",
      uncalledRecessionColour = "#f6eabe",
      graphDiv = "graph",
      outputGapText = "output_gap_text_under_data",
      viewportHorizontalMaxSizeMobile = 520;


function getAPIData(url) {
  const req = new XMLHttpRequest();
  req.open("GET", url, true);
  return req;
};

const QUARTER = {
  0: "Q1",
  0.25: "Q2",
  0.5: "Q3",
  0.75: "Q4"
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

function getQuarter(val) {
  const q = val % 1;
  return QUARTER[q];
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
    lastQuarterOutputGap = parseFloat(cValList[cValList.length-1]['gapPercentage']).toFixed(1),
    nowcastGap = parseFloat(nValList[0]['gapPercentage']).toFixed(1),
    forecastGap = parseFloat(nValList[1]['gapPercentage']).toFixed(1),
    lastQuarterTypeIsIntitialRealised = (cValList[cValList.length-1]['isRealized'] === 'True'),
    nowcastGapIsIntitialRealised = (nValList[0]['isRealized'] === 'True');

  
  document.getElementById(outputGapText).innerHTML = 
      '<p>' + (isCurrentQuarter(nowcastForcastXVal[1]) ? `Output Gap ${getYearAndQuarter(nowcastForcastXVal[1])}: ${forecastGap}% (forecast)<br/>` : "") + 
      `${!nowcastGapIsIntitialRealised ? "<b>": "" } 
      Output Gap ${getYearAndQuarter(nowcastForcastXVal[0])}: ${nowcastGap}% ${nowcastGapIsIntitialRealised ? '(realized)' : "(nowcast)"}
      ${!nowcastGapIsIntitialRealised ? "</b>": "" } <br/>
      Output Gap ${getYearAndQuarter(concreteXVal[concreteXVal.length-1])}: ${lastQuarterOutputGap}% ${lastQuarterTypeIsIntitialRealised ? '(realized)' : ""}
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
    concreteYVal.push(parseFloat(cValList[i]['gapPercentage']));
  };

  for (var i = 0; i < nValList.length; i++) {
    nowcastForecastYVal.push(parseFloat(nValList[i]['gapPercentage']));
  };

  // Necessary so that the estimates align with recessions and that the X-axis 
  // for the estimates now correspond with the end of the quarter, not the start
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


  const yearQuarterText = Object.keys(reqJSON['concreteObservations']).map(getYearAndQuarter);

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
    // small stylistic adjustments for mobile and desktop view
    font: { size: window.screen.width < viewportHorizontalMaxSizeMobile ? 30 : 13 },
    height: window.screen.width < viewportHorizontalMaxSizeMobile ? 650 : 500 ,
    autosize: true,
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
      automargin: true,
      hoverformat: '.4f'
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

function restrictGraphOperations(fig){

  fig.on('plotly_legenddoubleclick', () => false);

  fig.on('plotly_legendclick', (clickData) => {
    const curvNum = clickData.curveNumber;
    if (curvNum == 0 || curvNum == 1) return false;

    if (curvNum == 2) {
      const update = {};
      update["shapes[" + String(curvNum - 1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly';

      Plotly.relayout(graphDiv, update);
    };

  });
};

const gapRequest = getAPIData(gapDataURL);
gapRequest.timeout = 8000;

gapRequest.onload = function () {
  const fig = document.getElementById(graphDiv);
  if (this.status == 200){
    fig.innerHTML = '';
    const reqJSON =  JSON.parse(gapRequest.responseText);
    
    graph(reqJSON);

    restrictGraphOperations(fig);

    writeTextBelowGraph(reqJSON);

    //if (window.screen.width < viewportHorizontalMaxSizeMobile) document.getElementsByClassName("twitter-hashtag-button")[0].setAttribute("data-size", "large");

  } else { fig.innerHTML = '<br><br><br><br><b>Site momentarily undergoing maintenance. Please come back later.</b><br><br><br><br>'; };
};

gapRequest.send(null);


const last4MontlyIndicatorsRequest = getAPIData(last4MontlyIndicatorsDataURL);
last4MontlyIndicatorsRequest.timeout = 8000;

last4MontlyIndicatorsRequest.onload = function () {
  if (this.status == 200){
    const reqJSON =  JSON.parse(last4MontlyIndicatorsRequest.responseText);

    buildMonthlyIndicatorsTable(reqJSON.observations);

  };
};

last4MontlyIndicatorsRequest.send(null);

const quarterlyDataRequest = getAPIData(quarterlyDataURL);
quarterlyDataRequest.timeout = 8000;

quarterlyDataRequest.onload = function () {
  if (this.status == 200){
    const reqJSON =  JSON.parse(quarterlyDataRequest.responseText);

    buildQuarterlyIndicatorsTable(reqJSON.observations);

  };
};

quarterlyDataRequest.send(null);


const historicalNowcastsRequest = getAPIData(historicalNowcastsDataURL);
historicalNowcastsRequest.timeout = 8000;

historicalNowcastsRequest.onload = function () {
  if (this.status == 200){
    const reqJSON =  JSON.parse(historicalNowcastsRequest.responseText);

    buildHistoricNowcastsTable(reqJSON);

    buildHistoricNowcastsSelectorList(reqJSON);

  };
};

historicalNowcastsRequest.send(null);

function onResize() {
  graph(JSON.parse(gapRequest.responseText));
  const fig = document.getElementById(graphDiv);
  restrictGraphOperations(fig);
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

function buildMonthlyIndicatorsTable(dataDict) {

  const 
    keyArray = [],
    dataArray = [],
    monthlyIndicatorsTable = document.getElementById('monthlyIndicatorsTable');

  for (const key in dataDict) {
    keyArray.push(key);
    dataArray.push(dataDict[key]);
  };

  const titles = ["Federal funds rate (%)", "Term spread (ppt)", "Risk spread (ppt)", "Stock returns (%)",
    "Consumer sentiment (indx.)", "U-2 unemployment rate (%)", "Monthly CPI inflation (%)", "IP growth (%)", "Housing starts growth (%)"];
  const dictKeys = ["FEDFUNDS", "TERMSPREAD", "RISKSPREAD", "SP500PERC", "UMCSENT", "U2RATE", "CPIAUCSLPERC", "INDPROPERC", "HOUSTPERC"];

  var horizontalHeader = "<tr><th></th>";
  for (const key of keyArray) {
    horizontalHeader += "<th>" + MONTH[key.slice(-2)] + "</th>";
  };

  horizontalHeader += "</tr><tr>";
  monthlyIndicatorsTable.innerHTML += horizontalHeader;

  for (var k = 0; k < dictKeys.length; k++) {
    var row = `<tr><th>${titles[k]}</th>`;
    for (var i = 0; i < dataArray.length; i++) {
      row += `<td>${roundSpecial(dataArray[i][dictKeys[k]], (dictKeys[k] == "U2RATE" || dictKeys[k] == "UMCSENT"))}</td>`;
    };
    row += "</tr>";
    monthlyIndicatorsTable.innerHTML += row;
  };
};

function buildQuarterlyIndicatorsTable(dataDict) {

  const numberOfQuartersToDisplay = 1;

  const 
    keyArray = [],
    dataArray = [],
    percentChangeDataArray = [],
    quarterlyIndicatorsTable = document.getElementById('quarterlyIndicatorsTable');


  for (const key in dataDict) {
    keyArray.push(key);
    dataArray.push(dataDict[key]);
  };

  const title = "Real GDP growth (%)";
  const dictKey = "GDPC1";

  // percentage change
  for (var i = 1; i < dataArray.length; i++){
    var obj = {};
    obj[dictKey] = ((parseFloat(dataArray[i][dictKey]) - parseFloat(dataArray[i-1][dictKey]))/parseFloat(dataArray[i-1][dictKey]))*100;
    percentChangeDataArray[i] = obj;
  };

  const 
    smallerKeyArray = keyArray.slice(keyArray.length-numberOfQuartersToDisplay),
    smallerDataArray = percentChangeDataArray.slice(keyArray.length-numberOfQuartersToDisplay);

  var horizontalHeader = "<tr><th></th>";
  for (const key of smallerKeyArray) {
    horizontalHeader += "<th>" + getQuarter(key) + "</th>";
  };

  horizontalHeader += "</tr><tr>";
  quarterlyIndicatorsTable.innerHTML += horizontalHeader;

  var row = `<tr><th>${title}</th>`;
  for (var i = 0; i < smallerDataArray.length; i++) {
    row += `<td>${smallerDataArray[i][dictKey].toFixed(2)}</td>`;
  };
  row += "</tr>";
  quarterlyIndicatorsTable.innerHTML += row;

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

  if (keyArray.length == 0) return null;

  const numberOfColumns = keyArray.length < 3 ? keyArray.length : 3

  historicalNowcastsTable.innerHTML += `<tr><th colspan=${numberOfColumns * 2}>Historical Nowcasts for ${getYearAndQuarter(dataDict.latestRunUTC)}</th></tr>`;

  var idx = 0;
  for (var r = 0; r < keyArray.length; r++){
    var row = "";
    for (var c = 0; c < numberOfColumns; c++){
      if (idx >= keyArray.length) break;
      row += `<td><b>${(getCondensedDate(keyArray[idx]))}</b></td><td>${round(dataArray[idx].gapPercentage)}</td>`;
      idx += 1;
    };
    historicalNowcastsTable.innerHTML += `<tr class="rowBorder">${row}</tr>`;
  };

};

function buildHistoricNowcastsSelectorList(dataDict) {
  const histNowcastsQSelector = document.getElementById('historicalNowcastsQuarterSelector');
  histNowcastsQSelector.options[histNowcastsQSelector.options.length] = new Option(getYearAndQuarter(dataDict.latestRunUTC), getYearAndQuarter(dataDict.latestRunUTC));
}

;