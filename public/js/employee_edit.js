/**
 * JavaScript for the "Employees" create/edit view.
 **/

function getTopPos(el) {
    for (var topPos = 0;
        el != null;
        topPos += el.offsetTop, el = el.offsetParent);
    return topPos;
}

function getElementPosition(element) {
    // yay readability
    for (var lx=0, ly=0;
         element != null;
		 lx += element.offsetLeft, ly += element.offsetTop, element = element.offsetParent);
    return {x: lx,y: ly};
}


//reads an image in the browser without server upload
function readImageInBrowser(input) {

	//validate exactly 1 file was provided
	if (input.files && input.files[0]) {

		var reader = new FileReader();
		reader.onload = function (e) {

			//set the placeholder tag to the image source
			$('#newImage').attr('src', e.target.result);

			detectFace(input.files[0], (err, data) => {
				if (!err) {
					
					var thumb = document.getElementById('imageThumbnail'); 
					var {x,y} = getElementPosition(thumb);
					alert("X:"+x);
					alert("Y:"+y);

					drawRectangle(x,y);
					var cog = JSON.parse(data);
					hasExactlyOneFace(cog);
				}

			});
			showImageDimensions();
		}
		//processImage(input.files[0]);		
		reader.readAsDataURL(input.files[0]);
	}
}

//setup events for fileupload
$('.fileinput').fileinput();


// //after image has been selected
// $("#image").change(function () {
// 	$("#imageThumbnail").attr("")
// 	readImageInBrowser(this);
// });

function drawRectangle(x, y){
	alert('drawing rectangle');
	$("#rectangleHolder").css("border", "3px solid blue");
	$("#rectangleHolder").css("position", "absolute");
	$("#rectangleHolder").css("top", "0px");
	$("#rectangleHolder").css("left", "0px");
	$("#rectangleHolder").css("width", "100px");
	$("#rectangleHolder").css("height", "100px");
}

function showImageDimensions() {

	//grab dimensions of the new image (if any)
	var newImage = document.getElementById('newImage'); 
	//alert(`newImage actual: 'width: ${newImage.naturalWidth} and height: ${newImage.naturalHeight}`);

	//grab dimensions of the existing image, both before and after rendering
	var oldImage = document.getElementById('existingImage'); 
	var actualWidth=oldImage.naturalWidth;
	var actualHeight = oldImage.naturalHeight;
	var shownWidth=oldImage.clientWidth;
	var shownHeight = oldImage.clientHeight;
	//alert(`shown: 'width: ${shownWidth} and height: ${shownHeight}`);
	//alert(`actual: 'width: ${actualWidth} and height: ${actualHeight}`);

	
	//alert (`oldImage x:${oldImage.x} y:${oldImage.y}`);

var face = detectFace()

	//put a rectangle at the right spot
	var holder = document.getElementById("rectangleHolder");
	holder.x = oldImage.x;


}

function hasExactlyOneFace(cogResult, callback) {
	if (cogResult && cogResult.length===1) {
		var faceRect = cogResult[0].faceRectangle;
		alert(faceRect);
		return false;
	}
}

//uses Azure cognitive to detect a face in an image
function detectFace(file, callback) {

	var subscriptionKey = "0f7f31d0d4ef4f1580a2fb29e11c0248";
	var uriBase = "https://eastus.api.cognitive.microsoft.com/face/v1.0/detect";

	// Request parameters.
	var params = {
		"returnFaceId": "true",
		"returnFaceLandmarks": "false",
		"returnFaceAttributes":
			"age,gender,headPose,smile,facialHair,glasses,emotion," +
			"hair,makeup,occlusion,accessories,blur,exposure,noise"
	};


	// Perform the REST API call.
	$.ajax({
		url: uriBase + "?" + $.param(params),

		// Request headers.
		beforeSend: function (xhrObj) {
			xhrObj.setRequestHeader("Content-Type", "application/octet-stream");//use application/json if sending a Url instead of BinaryString
			xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
		},

		type: "POST",
		/*
			use this format if sending a Url
			 data: '{"url": ' + '"' + sourceImageUrl + '"}',
			 //can be read from
			 //var sourceImageUrl = document.getElementById("imageIdHere").value;
	
		*/
		data: file,
		processData: false
	})

		.done(function (data) {
			var text = JSON.stringify(data, null, 2);
			callback(null, text);
		})

		.fail(function (jqXHR, textStatus, errorThrown) {
			// Display error message.
			var errorString = (errorThrown === "") ?
				"Error. " : errorThrown + " (" + jqXHR.status + "): ";
			errorString += (jqXHR.responseText === "") ?
				"" : (jQuery.parseJSON(jqXHR.responseText).message) ?
					jQuery.parseJSON(jqXHR.responseText).message :
					jQuery.parseJSON(jqXHR.responseText).error.message;
			callback(errorThrown, errorString);
		});
};