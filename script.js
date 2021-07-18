url = 'https://nowcasting-the-us-output-gap.herokuapp.com/time-series-data/gap/?type=json';

function getGapData(){
    var req = new XMLHttpRequest();
    req.open( "GET", url, false);
    req.send(null);
    return req.responseText;
}

function graph() {
    var gapDict = JSON.parse(getGapData());

    document.getElementById("last_update").innerHTML = "Latest update: "+ String(gapDict['latestRunUTC']) + " UTC";

      valList = Object.values(gapDict['observations'])

      yval = []

      console.log(valList)
      for (var i = 0; i < valList.length; i++){
        yval.push(valList[i]['gapPercentage'])
      }

      console.log(yval)
      var trace3 = {
        x: Object.keys(gapDict['observations']),
        y: yval,
        mode: 'lines + markers',
        name: 'Scatter + Lines'
      };

      var layout = {autosize: true,
                    margin:{'l': 30, 'r': 30, 't': 30, 'b': 30}}
      
      var data = [trace3];

    Plotly.newPlot("graph", data, layout);
}

graph();

