/**
 * Created by dconway on 08/01/15.
 */

 var fs = require('fs');


var makeFile = function(graph){
    var filename = '/usr/share/ganglia-webfrontend/graph.d/' + graph.report_name + '.json'
    fs.writeFile(filename, JSON.stringify(graph), null, function (err,data) {
      if (err) {
         console.log(err)
      }
   });
}

 var generateGraph = function(name, config){
    var graph = {}
    graph.report_name = name
    graph.report_type = 'standard'

    name = name.replace('openi_','')
    name = name.replace('_report','')
    name = name.replace('_', ' ')

    graph.title = name
    graph.vertical_label = 'Requests/sec'

    var series = []
    Object.keys(config).forEach(function (item) {
        var report = {}
        report.metric = item
        report.color = config[item].color
        report.label = config[item].label
        report.line_width = '2'
        report.type = 'line'

        series.push(report)
    })

    graph.series = series;

    makeFile(graph);
 }

 var makeView = function(graph){
    var filename = '/var/lib/ganglia-web/conf/view_OPENi.json'
    var view = {};
    view.view_name = 'OPENi'

    var items = [];

    if (graph !== null || graph !== undefined) {
        for (var i = 0; i < graph.length; i++) {
            var item = {hostname:'localhost'}
            item.graph = graph[i]

            items.push(item)
        };

        view.items = items;
        fs.writeFile(filename, JSON.stringify(view), null, function (err,data) {
            if (err) {
                console.log(err)
            }
        });
    }
}

module.exports.generateGraph = generateGraph;
module.exports.makeView = makeView;