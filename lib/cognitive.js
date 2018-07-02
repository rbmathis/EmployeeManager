var face1Id;
var face2Id;

var CONFIG = require('../config');
const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const FaceAPIClient = require('azure-cognitiveservices-face');
const request = require('request');
const path = require('path');
const fs = require('fs');


exports.verifyFacesMatch = function (url1, url2, callback) {
    let credentials = new CognitiveServicesCredentials(CONFIG.cognitive.face.key);
    let client = new FaceAPIClient(credentials, CONFIG.cognitive.face.region);

    //detect face 1
    client.face.detect(url1,
        { returnFaceId: true },
        function (err, result, request, response) {
            if (err) {
                console.log(err);
            } else {
                face1Id = result[0].faceId;
                console.log(`Found face : ${face1Id} at ${url1}`);

                //detect face 2
                client.face.detect(url2,
                    { returnFaceId: true },
                    function (err, result, request, response) {
                        if (err) {
                            console.log(err);
                        } else {
                            face2Id = result[0].faceId;
                            console.log(`Found face : ${face2Id} at ${url2}`);

                            //confirm the 2 faces match
                            client.face.verify(
                                face1Id,
                                face2Id,
                                null,
                                function (err, result, request, response) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(result.isIdentical);
                                        console.log(result.confidence);
                                        callback(null, result);
                                    };
                                });//client.face.verify(
                        }
                    });//client.face.detect(url2,
            }
        });//client.face.detect(url1,
}

exports.detectFace = function (url, callback) {
    let credentials = new CognitiveServicesCredentials(CONFIG.cognitive.face.key);
    let client = new FaceAPIClient(credentials, CONFIG.cognitive.face.region);

    client.face.detect(
        url,
        { returnFaceId: true },
        function (err, result) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                callback(null,result);
            }
    });//client.face.detect(
}

exports.createThumbnail = function(sourceUrl, callback){
    //const subscriptionKey = '7d13f54dbf0c4190befcca1b8d4d88d6';

    // You must use the same location in your REST call as you used to get your
    // subscription keys. For example, if you got your subscription keys from
    // westus, replace "westcentralus" in the URL below with "westus".
    //const uriBase = 'https://eastus.api.cognitive.microsoft.com/vision/v2.0/generateThumbnail';
    var uriBase = CONFIG.cognitive.thumbnail.endpoint;
    
    //const imageUrl = 'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2b15837ba8bd6c0c299d4d.jpg';
    //const imageUrl = 'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2d09452f648b0744ac03bf.jpg';
    var imageUrl = sourceUrl;
    
    // Request parameters.
    const params = {
        'width': '300',
        'height': '200',
        'smartCropping': 'true'
    };
    
    const options = {
        uri: uriBase,
        qs: params,
        body: '{"url": ' + '"' + imageUrl + '"}',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': CONFIG.cognitive.thumbnail.key
        },
        encoding: null
    };
    

    var tmpFileName = `${Date.now()}${path.extname(sourceUrl)}`;
    //var file = FS.createWriteStream('temp.jpg');
    //var file = FS.createWriteStream(tmpFileName);
    
    request.post(options, (error, response, body) => {
        if (error) {
            console.log('Error: ', error);
            callback(error, null);
        } else {
            //FS.writeFile('temp.jpeg', body);
            fs.writeFile(tmpFileName, body);
            callback(null, tmpFileName);
        }
    
    });
}
