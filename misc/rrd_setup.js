var rrd = require("rrd")


var filename;
var rrd_root = '/var/lib/ganglia/rrds/OPENi Cluster/localhost/openi_';

var setup_rrds = {
   "objects"  : ["get", "post", "put", "delete"],
   "types"    : ["get", "post", "put", "delete"],
   "cloudlets": ["get", "post", "put", "delete"]
}

function now() {
   return Math.ceil((new Date).getTime() / 1000);
}

Object.keys(setup_rrds).forEach(function (key) {
   var rrd_key = setup_rrds[key];
   for (var i = 0; i < rrd_key.length; i++) {

      filename = rrd_root+key+"_"+rrd_key[i]+".rrd"

      /*
       This RRD collects data every 10 seconds and stores its averages over 5 minutes, 15 minutes,
       1 hour, and 1 day, as well as the maxima for 1 hour and 1 day.
       */

      rrd.create(filename, 10, now(), ['DS:sum:GAUGE:60:0:U',
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
});
