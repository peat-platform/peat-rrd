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

function now() {
   return Math.ceil((new Date).getTime() / 1000);
}

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
         if (error !== null) {
            console.log('Error:', error);
         }
      });


      stats[key]=0
   });
},10*1000);


module.exports.init            = init;
module.exports.filter          = filter;
