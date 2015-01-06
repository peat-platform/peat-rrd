/**
 * Created by dconway on 11/11/14.
 */

var rrd = require('rrd');
var fs = require('fs');
var async = require('async')

var api;
var filename;
var rrd_root = '/var/lib/ganglia/rrds/OPENi_Cluster/localhost/openi_';
var crud = ["get", "post", "put", "delete"]

var stats = {
   'get'   : 0,
   'post'  : 0,
   'put'   : 0,
   'delete': 0
};

var isEmpty = function(obj) {
  return Object.keys(obj).length === 0;
}

var now = function() {
   return Math.ceil((new Date).getTime() / 1000);
}

var checkRRD = function(rrdFile,callback){
   fs.readFile(rrdFile, 'utf8', function (err,data) {
      if (err) {
         console.log("no RRD Found")
         callback(false)
      }
      else {
         console.log("RRD exists, skipping.");
         callback(true)
      }
   });
}

var create = function(rrdFile){
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
            console.log("Error:", error);
         }
         else {
            console.log("RRD created!");
         }
      });
}


var init = function(api_name, level) {
   if(api_name === undefined || api_name === null){
      throw 'Error: Api_name cannot be null';
   }

   var rrds = []
   //if (level.toLowerCase()=="crud") {
   Object.keys(crud).forEach(function (crud_key) {
      var key = crud[crud_key];
      var keyrrd = function(callback) {
         rrdFile = rrd_root + api_name + "_" + key + ".rrd"
         //console.log(rrdFile)
         checkRRD(rrdFile, function (exists) {
            if (!exists) {
               create(rrdFile)
               callback(null)
            }
            else {
               callback("Error")
            }
         })
      }
      rrds.push(keyrrd)
   });

   async.series(rrds);
   //}
   api = api_name;
   start()
};


var filter = function(msg, response) {

   if(api === undefined || api === null){
      throw 'Error: Api_name was not set, run "rrd.init()"';
   }

   switch (msg.headers.METHOD) {
      case 'POST':
         stats.post++;
         break;
      case 'GET':
         stats.get++;
         break;
      case 'PUT':
         stats.put++;
         break;
      case 'DELETE':
         stats.delete++;
         break;
      default:
         break;
   }
};


var start = function() {
   setInterval(function() {
      Object.keys(stats).forEach(function (key) {
         var value = stats[key]
         filename = rrd_root+api+"_"+key+".rrd"
         rrd.update(filename, 'sum', [[now(), value].join(':')], function (error) {
            if (error !== null) {
               console.log('Error:', error);
            }
         });
         stats[key]=0
      });
   },10*1000);
}


module.exports.init            = init;
module.exports.filter          = filter;
