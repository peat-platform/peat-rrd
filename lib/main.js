/**
 * Created by dconway on 11/11/14.
 */

var rrd = require('rrd');

var api;
var filename;
var rrd_root = '/var/lib/ganglia/rrds/OPENi Cluster/localhost/openi_';

var stats = {
   'get'   : 0,
   'post'  : 0,
   'put'   : 0,
   'delete': 0
};


var init = function(api_name) {
   if(api_name === undefined || api_name === null){
      throw 'Error: Api_name cannot be null';
   }
   api = api_name;
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


setInterval(function() {
   Object.keys(stats).forEach(function (key) {
      var value = stats[key]
      filename = rrd_root+api+"_"+key+".rrd"

      rrd.update(filename, 'sum', [[now(), value].join(':')], function (error) {
         if (error) console.log('Error:', error);
      });
   });
},10*1000);


module.exports.init            = init;
module.exports.filter          = filter;


//filename = rrd_root+api+"_"+msg.headers.METHOD.toLowerCase()+".rrd"


/*
var setup_rrds = {
   "object_api"  : ["get", "post", "put", "delete"],
   "type_api"    : ["get", "post", "put", "delete"],
   "cloudlet_api": ["get", "post", "put", "delete"]
}


Object.keys(setup_rrds).forEach(function (key) {
   var rrd_key = setup_rrds[key];
   for (var i = 0; i < rrd_key.length; i++) {
      console.log(key + ": " + rrd_key[i])

      var filename = '/var/lib/ganglia/rrds/OPENi Cluster/localhost/openi_test.rrd'

      rrd.info(filename, function (info) {
         if (info === undefined) {
         console.log("no File")
//            rrd.create(filename, 60, now, ["DS:busy:GAUGE:120:0:U", "RRA:LAST:0.5:1:60"], function (error) {
//               if (error) console.log("Error:", error);
//            });
         }
      });


   }
});
   */

/*
 var regex = /\/api\/v1\/([a-z]*)\//i;

 var match = msg.headers.PATH.match(regex);
 var api = match[1]
 */