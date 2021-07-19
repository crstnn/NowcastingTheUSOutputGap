url = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap/?type=json';

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

function graph() {

    var gapDict = JSON.parse(getGapData());

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

      nowcastForcastXVal = Object.keys(gapDict['nowcastForecastObservations'])

      yearQuarterText = Object.keys(gapDict['concreteObservations']).map(getYearAndQuarter)

      var traceConcreteObs = {
        x: Object.keys(gapDict['concreteObservations']),
        y: concreteYVal,
        mode: 'lines + markers',
        name: 'Concrete Observations',
        customdata: yearQuarterText,
        hovertemplate: "%{customdata}, %{y}",
        line: {color: "#0b789c"}
      };

      nowcastXVal = [nowcastForcastXVal[0]]

      var traceNowcast = {
        x: nowcastXVal,
        y: [nowcastForecastYVal[0]],
        mode: 'lines + markers',
        name: 'Nowcast',
        customdata: nowcastXVal.map(getYearAndQuarter),
        hovertemplate: "%{customdata}, %{y}",
        line: {color: "#EF8354"}
      };

      forecastXVal = nowcastForcastXVal.slice(Math.max(nowcastForcastXVal.length - 5, 1))

      var traceForecast = {
        x: forecastXVal,
        y: nowcastForecastYVal,
        mode: 'lines + markers',
        name: 'Conditional Forecast',
        customdata: forecastXVal.map(getYearAndQuarter),
        hovertemplate: "%{customdata}, %{y}",
        visible: "legendonly",
        line: {color: "#89b34a"}
      };

      var layout = {autosize: true,
                    margin: {'l': 30, 'r': 30, 't': 30, 'b': 30},
                    yaxis: {
                      ticksuffix: "%"},
                    legend: {
                        orientation: "h",
                        yanchor: "top",
                        y: 1.02,
                        xanchor: "right",
                        x: 1}}
                        
      var data = [traceConcreteObs, traceNowcast, traceForecast];

      Plotly.newPlot("graph", data, layout);

}

graph();

