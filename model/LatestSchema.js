var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function(dbName) {
  // define schema

  var latestvideos = new Schema({
    name : String,
    content :[{
    	img : String,
    	name : String,
    	href : String
     }]
  });
  mongoose.model(dbName+'latest', latestvideos);
};