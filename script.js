url = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap/?type=json';
concreteColour = "#0b789c";
nowcastColour = "#EF8354";
forecastColour = "#89b34a";
recessionColour = "#DDDDDD";
graphDiv = "graph";


function getGapData(){
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
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
                        x: 1}
                      }
      
      const recessions = [[1969.75, 1970.75],
      [1973.75, 1975.0],
      [1980.0, 1980.5],
      [1981.5, 1982.75],
      [1990.5, 1991.0],
      [2001.0, 2001.75],
      [2007.75, 2009.25],
      [2020.0, 2020.25]] 

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
      }))
                        
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


var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}
