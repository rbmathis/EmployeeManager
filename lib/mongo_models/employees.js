module.exports = function(mongoose) {
	var collection = 'employees';
	var Schema = mongoose.Schema;
	var ObjectId = Schema.ObjectId;

	var schema = new Schema({
		name: { 
			type: String, 
			index: true
		},
		imageExtension: String,
		description: String,
		department: String,
		employeeId: { type: String, index :true},
		faceRectangle : String,
		created_by: {
			type: ObjectId,
			ref: 'users'
		},
		last_edit_by: {
			type: ObjectId,
			ref: 'users'
		},
		created: {type: Date, default: Date.now},
		edited: {type: Date, default: Date.now}
	});

	return mongoose.model(collection, schema);
};

