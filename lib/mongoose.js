module.exports = function(CONFIG){
	var mongoose = require('mongoose');
	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'connection error:'));

	db.once('open', function callback(){
	  console.log('Connected to DB');
	});

	mongoose.connect(CONFIG.mongo.uri);

	return mongoose;
}



