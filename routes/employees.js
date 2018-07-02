var multiparty = require('multiparty');
var fs = require('fs');
var blobs = require('../lib/blobs.js');
var cognitive = require('../lib/cognitive.js');
var async = require('async');

module.exports = function (CONFIG, app, ensureAuthenticated, mongoose, models) {

	// Show the employee creation form
	app.get('/employees/create', ensureAuthenticated, function (req, res, next) {
		res.render('employees/detail', {
			title: 'Employees - Edit',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			form_action: '/employees/create/',
			item: '',
			validation: '',
			error_msg: '',
			rect: null
		});
	});

	// Receive the new employee form data
	app.post('/employees/create', ensureAuthenticated, fileUploads, async function (req, res, next) {

		// Check for errors on POST data
		var val_errors = {};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'department'
			//'description'
		]
		for (k in check) {
			if (!(req.body[check[k]])) {
				val_errors[check[k]] = true;
				has_errors = true;
			}
		}

		var now = new Date();
		var employee = new models.employees({
			name: req.body.name,
			description: req.body.description,
			department: req.body.department,
			created_by: req.user._id,
			created: now,
			last_edit_by: req.user._id,
			edited: now
		});

		processImageUpload(req, res, employee, val_errors, has_errors, error_msg, function (err, employee) {

			if (!err) {
				//save the employee to cosmos
				employee.save(function (err, new_employee) {
					if (!err) {

						//ultimate success!
						setFlashAndRedirect(req, res, 'success', `${employee.name} was created successfully.`, '/employees/');


					} else {

						//cosmos save failed
						if (err.code == 11000) {
							error_msg[0] = 'Duplicate entry.';
							val_errors.email = true;
						} else {
							// In an unkown error
							error_msg[0] = 'Unknown error, try again later.';
							console.log(err);
						}
						handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
						return;

					}
				});
			} else {
				handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
				return;
			}

		});

	});

	// Show the edit form with the employee data
	app.get('/employees/edit/:id/', ensureAuthenticated, function (req, res, next) {
		models.employees.findOne({
			_id: req.params.id
		}, function (err, data) {
			if (data) {
				res.render('employees/detail', {
					title: 'Employees - Edit',
					site: CONFIG.site,
					user: req.user,
					path: req.url,
					form_action: '/employees/update/' + req.params.id + '/',
					item: data,
					validation: '',
					error_msg: '',
					rect: JSON.parse(data.faceRectangle)
				});
			} else {
				// 404 - employee not found on DB
				next();
			}
		});
	});

	// Receive the edited employee form data
	app.post('/employees/edit/:id/', ensureAuthenticated, fileUploads, function (req, res, next) {

		//look for images
		var img = null;
		if (req.body.files.image) {
			img = req.body.files.image;
			if (img.type != 'image/png' && img.type != 'image/jpeg') {
				fs.unlinkSync(img.path);
				img = null;
			}
		}

		// Check for errors on POST data
		var val_errors = {};
		var has_errors = false;
		var error_msg = [];
		var check = [
			'name',
			'department'
			//'description'
		]
		for (k in check) {
			if (!(req.body[check[k]])) {
				val_errors[check[k]] = true;
				has_errors = true;
			}
		}

		// Find selected employee
		models.employees.findOne({
			_id: req.params.id
		}, function (err, employee) {
			if (employee) {

				// Modify values received from the form
				employee.name = req.body.name;
				employee.description = req.body.description;
				employee.department = req.body.department;
				employee.last_edit_by = req.user._id;
				employee.edited = new Date();

				//if they only updated details, and not the image, process and return
				if (img === null) {
					employee.save();

					//ultimate success!
					setFlashAndRedirect(req, res, 'success', `${employee.name} was updated successfully.`, '/employees/');
					return;
				}

				//save the new file with tmp name
				var tmpFilename = (Date.now() + img.ext).toLowerCase();
				blobs.moveLocalFileToBlobStorage(CONFIG, img, tmpFilename, function (err, blob) {
					if (!err) {

						//detect a face
						var imageUrl = CONFIG.blobs.url + blob.container + '/' + blob.name;
						cognitive.detectFace(CONFIG, imageUrl, function (err, result) {
							if (!err) {

								//there is only one face
								if (result.length === 1) {

									var faceRectangle = JSON.stringify(result[0].faceRectangle);

									// ensure the same person is in the both images
									var tmpUrl = CONFIG.blobs.url + blob.container + '/' + tmpFilename;
									var empUrl = CONFIG.blobs.url + blob.container + '/' + employee.id + employee.imageExtension;
									cognitive.verifyFacesMatch(CONFIG, tmpUrl, empUrl, function (err, result) {
										if (!err) {

											//identical people?
											if (result.isIdentical) {

												employee.faceRectangle = faceRectangle;

												//cosmos save
												employee.save(function (err, new_employee) {
													if (!err) {
														// if (result.length === 1) {

														//rename the new blob (remove the "tmp")
														blobs.copyBlob(CONFIG, tmpUrl, CONFIG.blobs.containerName, employee.id + employee.imageExtension, function (err, result) {
															if (!err) {
																blobs.deleteBlob(CONFIG, tmpFilename);
															}
														})

														//ultimate success!
														setFlashAndRedirect(req, res, 'success', `${employee.name} was updated successfully.`, '/employees/');

													} else {

														//cosmos failed
														if (err.code == 11000) {
															error_msg[0] = 'Duplicate entry.';
															val_errors.email = true;
														} else {
															// In an unkown error
															error_msg[0] = 'Unknown error, try again later.';
															console.log(err);
														}
														res.render('employees/detail', {
															title: 'Employees - Edit',
															site: CONFIG.site,
															user: req.user,
															path: req.url,
															form_action: '/employees/update/' + req.params.id + '/',
															item: employee,
															validation: val_errors,
															error_msg: error_msg,
															rect: JSON.parse(employee.faceRectangle)
														});
													}
												})//employee.save(function (err, new_employee) {
											}
											else {
												// the faces don't match
												blobs.deleteBlob(CONFIG, tmpFilename, null);

												has_errors = true;
												val_errors['image'] = true;
												error_msg[0] = `The image you have uploaded doesn't match the employee's face. Please choose another photo. Confidence: ${(result.confidence) * 100}%`;
												res.render('employees/detail', {
													title: 'Employees - Edit',
													site: CONFIG.site,
													user: req.user,
													path: req.url,
													form_action: '/employees/update/' + req.params.id + '/',
													item: employee,
													validation: val_errors,
													error_msg: error_msg,
													rect: JSON.parse(employee.faceRectangle)
												});
											}
										}
									})
								} else {	//if (result.length === 1) {
									//we detected <> 1 face
									var imageUrl = CONFIG.blobs.url + blob.container + '/' + blob.name;
									blobs.deleteBlob(CONFIG, tmpFilename, null);

									has_errors = true;
									val_errors['image'] = true;
									error_msg[0] = `We require all photos to contain exactly one face, and we detected ${result.length} faces in the image provided.`;
									res.render('employees/detail', {
										title: 'Employees - Edit',
										site: CONFIG.site,
										user: req.user,
										path: req.url,
										form_action: '/employees/update/' + req.params.id + '/',
										item: employee,
										validation: val_errors,
										error_msg: error_msg,
										rect: JSON.parse(employee.faceRectangle)
									});
								}

							} else {	//err => cognitive.detectFace(CONFIG, imageUrl, function (err, result) {

								//we couldn't detect a face
								has_errors = true;
								val_errors['image'] = true;
								error_msg[0] = `An error occurred while examinig the photo for a face : ${err}`;
								res.render('employees/detail', {
									title: 'Employees - Edit',
									site: CONFIG.site,
									user: req.user,
									path: req.url,
									form_action: '/employees/update/' + req.params.id + '/',
									item: employee,
									validation: val_errors,
									error_msg: error_msg,
									rect: JSON.parse(employee.faceRectangle)
								});

							}
						});
					} else {

						//blob upload failed
						has_errors = true;
						val_errors['image'] = true;
						error_msg[0] = `An error occurred while uploading the employee photo to blob storage : ${err}`;
						res.render('employees/detail', {
							title: 'Employees - Edit',
							site: CONFIG.site,
							user: req.user,
							path: req.url,
							form_action: '/employees/update/' + req.params.id + '/',
							item: employee,
							validation: val_errors,
							error_msg: error_msg,
							rect: JSON.parse(employee.faceRectangle)
						});

					}
				});

			} else {
				// 404 - employee not found on DB
				next();
			}
		});
	});

	// Delete employees
	app.post('/employees/delete/:id/', ensureAuthenticated, function (req, res) {
		has_errors = false;

		//load the employee
		models.employees.findOne({
			_id: req.params.id
		}, function (err, employee) {

			if (employee) {

				// delete it
				employee.remove(function (err) {
					if (err) {
						has_errors = true;
						error_msg.push(`An error occurred while deleting the user from Cosmos : ${err}`);
					}

					//delete the blob image
					var imageUrl = CONFIG.blobs.url + CONFIG.blobs.containerName + '/' + employee.id + employee.imageExtension;
					blobs.deleteBlob(imageUrl, function (err) {
						if (err) {
							has_errors = true;
							error_msg.push(`An error occurred while deleting the user from blob storage : ${err}`);
						} else {
							setFlashAndRedirect(req, res, 'success', `${employee.name} has been deleted.`, '/employees/');
						}
					});

				});

			} else {
				// 404 - employee not found on DB
				error_msg.push(`An error occurred while deleting the user from Cosmos : ${err}`);
				next();
			}
		});


		if (has_errors) {
			setFlashAndRedirect(req, res, 'error', `Error occurred while deleting ${req.params.id} : ${err}.`, '/employees/');
		}
	});

	// Show the index page with pagination
	var employees_list = function (req, res, next) {
		var find = {};
		if (req.body.search) {
			var look_for = new RegExp(req.body.search, 'i');
			find['$or'] = [{ 'name': look_for }, { 'description': look_for }, { 'department': look_for }];
		}
		var page = (req.params.page || 1) - 1;
		var perPage = 10;

		models.employees
			.find(find)
			.populate('created_by')
			.select('_id name department description imageExtension created_by edited created')
			.sort({ name: 'asc' })
			.limit(perPage)
			.skip(perPage * page)
			.exec(function (err, data) {
				models.employees.find(find).count().exec(function (err, count) {
					res.render('employees/index', {
						title: 'Employees',
						site: CONFIG.site,
						user: req.user,
						path: req.url,
						employees: data,
						search: req.body.search,
						page: (page + 1),
						pages: Math.ceil(count / perPage),
						messages: req.flash('success'),
						error_msg: req.flash('error'),
						config: CONFIG
					});
				});
			});
	}

	//paging routes
	app.get('/employees/:page(\\d+)?', ensureAuthenticated, employees_list);
	app.post('/employees/:page(\\d+)?', ensureAuthenticated, employees_list);


	function fileUploads(req, res, next) {
		var form = new multiparty.Form({
			autoFiles: true,
			uploadDir: __dirname + '/../tmp'
			//,maxFilesSize: 5242880
		});
		form.parse(req, function (err, fields, files) {
			var form_files = {};
			for (k in files) {
				for (m in files[k]) {
					if (files[k][m].size < 1) {
						fs.unlinkSync(files[k][m].path);
					} else {
						form_files[k] = {
							name: files[k][m].originalFilename,
							type: files[k][m].headers['content-type'],
							path: files[k][m].path,
							size: files[k][m].size,
							ext: files[k][m].originalFilename.substr(files[k][m].originalFilename.lastIndexOf('.'))
						};
					}
				}
			}
			for (k in fields) {
				fields[k] = fields[k][0]
			}
			req.body = fields;
			req.body.files = form_files;
			next();
		});
	}

	function setFlashAndRedirect(req, res, type, msg, redirect) {
		req.flash(type, msg);
		setTimeout(() => {
			res.redirect(redirect);
		}, 500);
	}

	function handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg) {
		res.render('employees/detail', {
			title: 'Employees - Create',
			site: CONFIG.site,
			user: req.user,
			path: req.url,
			form_action: '/employees/create/',
			item: req.body,
			validation: val_errors,
			error_msg: error_msg,
			rect: null
		});

	}

	function processImageUpload(req, res, employee, val_errors, has_errors, error_msg, callback) {

		//grab the image from the upload
		var img = null;
		if (req.body.files.image) {
			img = req.body.files.image;

			//ensure it's a PNG/JPEG
			if (img.type != 'image/png' && img.type != 'image/jpeg') {
				fs.unlinkSync(img.path);//delete the local file
				img = null;
			}
		}

		//ensure no image errors
		if (null == img) {
			val_errors['image'] = true;
			has_errors = true;
		}

		if (has_errors) {
			error_msg[0] = `We only accept JPG or PNG images.`;
			handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
			return;
		}

		employee.imageExtension = img.ext;
		var photoBlobName = (employee.id + img.ext).toLowerCase();
		blobs.moveLocalFileToBlobStorage(img, photoBlobName, function (err, newBlob) {
			if (!err) {

				//detect a face
				var imageUrl = CONFIG.blobs.url + CONFIG.blobs.containerName + '/' + newBlob.name;
				cognitive.detectFace(imageUrl, function (err, result) {
					if (!err) {

						//ensure only 1 face
						if (result.length === 1) {
							console.log(`Successfully detected exactly one face in ${imageUrl}`);
							//grab the rectangle where the face is located
							employee.faceRectangle = JSON.stringify(result[0].faceRectangle);
							callback(null, employee);
							return;

						} else {

							//we detected <> 1 face
							//cleanup
							employee.remove(null);
							blobs.deleteBlob(CONFIG, photoBlobName, null);

							has_errors = true;
							val_errors['image'] = true;
							error_msg[0] = `We require all photos to contain exactly one face, and we detected ${result.length} faces in the image provided.`;
							handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
							return;
						}

					} else {
						//we couldn't detect a face

						employee.remove(null);
						blobs.deleteBlob(CONFIG, imageUrl, null);

						has_errors = true;
						val_errors['image'] = true;
						error_msg[0] = `An error occurred while examinig the photo for a face : ${err}`;
						handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
						return;

					}
				});
			} else {

				//blob upload failed
				employee.remove(null);

				has_errors = true;
				val_errors['image'] = true;
				error_msg[0] = `An error occurred while uploading the employee photo to blob storage : ${err}`;
				handleEmployeeCreateError(req, res, CONFIG, val_errors, error_msg);
				return;

			}
		});
	}
}
