/**
 * Created by dconway on 11/11/14.
 */

var rrd = {"create":function(){}, "update":function(){}}
var fs = require('fs');
var async = require('async')
var utils = require('./rrd_utils.js')

var api;
var filename;
var rrd_root = '/var/lib/ganglia/rrds/PEAT_Cluster/localhost/peat_';
var crud = ["get", "post", "put", "delete"]

var stats = {};

var monitoring_config;

var isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
}

var now = function() {
   return Math.ceil((new Date).getTime() / 1000);
}

var checkRRD = function(rrdFile,callback){
   fs.readFile(rrdFile, 'utf8', function (err,data) {
      if (err) {
         //no File found
         callback(false)
      }
      else {
         //File found
         callback(true)
      }
   });
}

var create = function(rrdFile, callback){
   /*
    This RRD collects data every 10 seconds and stores its averages over 5 minutes, 15 minutes,
    1 hour, and 1 day, as well as the maxima for 1 hour and 1 day.
    */
   rrd.create(rrdFile, 10, now(), ['DS:sum:GAUGE:60:0:U',
      'RRA:AVERAGE:0.5:6:60',          // Ever 1 min (10sec*6) keep last 1h of entries (1min*60)
      'RRA:AVERAGE:0.5:30:288',        // Ever 5 min (10sec*30) keep last 1 day of entries (5min*288)
      'RRA:AVERAGE:0.5:90:192',        // Ever 15 min (10sec*90) keep last 2 days of entries (15min*192)
      'RRA:AVERAGE:0.5:360:336',       // Ever 1 hour (10sec*360) keep last 14 days of entries (1hour*336)
      'RRA:MAX:0.5:360:744',           // Ever 1 hour (10sec*360) keep last 31 days of entries (1hour*744)
      'RRA:AVERAGE:0.5:8640:183',      // Ever 1 day (10sec*8640) keep last 6 months of entries (5min*288)
      'RRA:MAX:0.5:8640:183'           // Ever 1 day (10sec*8640) keep last 6 months of entries (5min*288)
   ], function (error) {
         if (error !== null) {
            callback(error);
         }
         callback()
      });
}

var generateRRDFunction = function(rrdFile){
   return(function(rrdFile){
      return function(callback){
         checkRRD(rrdFile, function (exists) {
         if (!exists) {
            create(rrdFile, function(error) {
                  callback(error)
               })
            }
            else {
               callback()
            }
         })
      }
   }(rrdFile))
}

var startAPI = function(config) {
   monitoring_config = config;

   Object.keys(config).forEach(function (module) {

      var moduleTypes = config[module]

      Object.keys(moduleTypes).forEach(function (type) {
         stats[module+"_"+type] = 0;

         var typeOptions = moduleTypes[type]
         if (typeOptions.length > 0) {
            for (var i = 0; i < typeOptions.length; i++) {
               stats[module+"_"+type+"_"+typeOptions[i]] = 0;
            }
         };
      });
   });

   start()
}


var init = function(config) {
   if(config === undefined || config === null || typeof config !== 'object'){
      throw 'Error: Incorrect config';
   }

   var rrds = []
   var graphs = []
   var tmp = 0;
   Object.keys(config).forEach(function (module) {
      var moduleTypes = config[module]

      if (module === "graphs") {
         Object.keys(moduleTypes).forEach(function (item) {
            var graph = moduleTypes[item]
            graphs.push(item)
            utils.generateGraph(item,graph)
         });
         utils.makeView(graphs)
      }
      else {
         Object.keys(moduleTypes).forEach(function (type) {
            var rrdFile = rrd_root + module.toString() + "_" + type + ".rrd"
            //stats[module+"_"+type] = 0;
            rrds.push(generateRRDFunction(rrdFile));

            var typeOptions = moduleTypes[type]
            if (typeOptions.length > 0) {
               for (var i = 0; i < typeOptions.length; i++) {
                  //stats[module+"_"+type+"_"+typeOptions[i]] = 0;
                  rrdFile = rrd_root + module.toString() + "_" + type + "_" + typeOptions[i] + ".rrd"
                  rrds.push(generateRRDFunction(rrdFile));
               }
            };
         });
      }
   });

   async.series(rrds);  
};

//################################### function(api ,msg, response)
var msgfilter = function(msg, response) {
   var api = null;

   /*if (msg.path.toLowerCase().contains("object")) {
      api = object
   } else if (msg.path.toLowerCase().contains("type")) {
      api = type
   } else if (msg.path.toLowerCase().contains("cloudlet")) {
      api = cloudlet
   };*/

   Object.keys(monitoring_config).forEach(function (api_Name) {
      if (msg.path.toLowerCase().indexOf(api_Name) > 0) {
         api = api_Name;
      }
   });

   if (api !== null) {
      switch (msg.headers.METHOD) {
         case 'POST':
            stats[api+"_post"]++;
            break;
         case 'GET':
            stats[api+"_get"]++;
            break;
         case 'PUT':
            stats[api+"_put"]++;
            break;
         case 'DELETE':
            stats[api+"_delete"]++;
            break;
         default:
            break;
      }
   };
};

var monitorIncrement = function(statistic) {
   if (statistic !== null && stats[statistic] !== undefined) {
      stats[statistic]++
   };
};


var start = function() {
   setInterval(function() {
      Object.keys(stats).forEach(function (key) {
         var value = stats[key]
         if (value > 0) {
            //console.log(key+": "+value)
         };
         filename = rrd_root+key+".rrd"
         rrd.update(filename, 'sum', [[now(), value].join(':')], function (error) {
            if (error !== null) {
               //console.log('Error:', error);
            }
         });
         stats[key]=0
      });
   },10*1000);
}


module.exports.init             = init;
module.exports.startAPI         = startAPI;
module.exports.msgfilter        = msgfilter;
module.exports.monitorIncrement = monitorIncrement;
