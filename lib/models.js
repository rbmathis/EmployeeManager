module.exports = function(mongoose, CONFIG){

	// mongoose models
	var models = {};

	// User model
	models.users = require(__dirname+'/mongo_models/users')(mongoose, CONFIG);
	models.employees = require(__dirname+'/mongo_models/employees')(mongoose, CONFIG);

	return models;

}
