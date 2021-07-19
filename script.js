url = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap/?type=json';
concreteColour = "#0b789c";
nowcastColour = "#EF8354";
forecastColour = "#89b34a";
graphDiv = "graph";


function getGapData(){
    var req = new XMLHttpRequest();
    req.open( "GET", url, false);
    req.send(null);
    return req.responseText;
}

function getYearAndQuarter(val){
    q = val % 1
    d = {
        0: "Q1",
        0.25: "Q2",
        0.5: "Q3",
        0.75: "Q4"
    }
    return String(~~val) + " " + String(d[q])
}

function graph(gapDict) {

    document.getElementById("last_update").innerHTML = "Latest update (UTC): "+ String(gapDict['latestRunUTC']);

      cValList = Object.values(gapDict['concreteObservations'])
      nValList = Object.values(gapDict['nowcastForecastObservations'])

      concreteYVal = []

      for (var i = 0; i < cValList.length; i++){
        concreteYVal.push(cValList[i]['gapPercentage'])
      }

      nowcastForecastYVal = []

      for (var i = 0; i < nValList.length; i++){
        nowcastForecastYVal.push(nValList[i]['gapPercentage'])
      }

      concreteXVal = Object.keys(gapDict['concreteObservations'])
      nowcastForcastXVal = Object.keys(gapDict['nowcastForecastObservations'])
      nowcastXVal = [nowcastForcastXVal[0]]
      nowcastYVal = [nowcastForecastYVal[0]]
      forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1))
      forecastYVal = nowcastForecastYVal.slice(Math.max(nowcastForecastYVal.length - 5, 1))

      yearQuarterText = Object.keys(gapDict['concreteObservations']).map(getYearAndQuarter)

      var traceConcreteObs = {
        x: concreteXVal,
        y: concreteYVal,
        mode: 'lines + markers',
        name: 'Concrete Estimates',
        customdata: yearQuarterText,
        hovertemplate: "%{customdata}, %{y}",
        line: {color: concreteColour}
      };

      var traceNowcast = {
        x: nowcastXVal,
        y: nowcastYVal,
        mode: 'lines + markers',
        name: 'Nowcast',
        customdata: nowcastXVal.map(getYearAndQuarter),
        hovertemplate: "%{customdata}, %{y}",
        line: {color: nowcastColour}
      };

      var traceForecast = {
        x: forecastXVal,
        y: forecastYVal,
        mode: 'lines + markers',
        name: 'Conditional Forecast',
        customdata: forecastXVal.map(getYearAndQuarter),
        hovertemplate: "%{customdata}, %{y}",
        visible: "legendonly",
        line: {color: forecastColour}
      };

      var layout = {autosize: true,
                    shapes: [
                      {
                        type: 'line',
                        x0: concreteXVal[concreteXVal.length-1],
                        y0: concreteYVal[concreteYVal.length-1],
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
                    margin: {'l': 35, 'r': 30, 't': 30, 'b': 30},
                    yaxis: {
                      ticksuffix: "%"},
                    legend: {
                        orientation: "h",
                        yanchor: "top",
                        y: 1.02,
                        xanchor: "right",
                        x: 1}
                      }
                        
      var data = [traceConcreteObs, traceNowcast, traceForecast];

      Plotly.newPlot(graphDiv, data, layout);

}

var gapDict = JSON.parse(getGapData());

graph(gapDict);

function onResize(){
  graph(gapDict);
}

const fig = document.getElementById(graphDiv)

fig.on('plotly_legenddoubleclick', () => false);

fig.on('plotly_legendclick', function(clickData) { 
  const curvNum = clickData.curveNumber

  if ([1, 2].includes(curvNum)){
    var update = {};
    update["shapes[" + String(curvNum-1) + "].visible"] = clickData.data[curvNum].visible == 'legendonly' ? true : false

    Plotly.relayout(graphDiv, update)
  }

})

