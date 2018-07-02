var CONFIG = require('./config');
var COGNITIVE = require('./lib/cognitive.js');
var FS = require('fs');

// const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
// // Creating the Cognitive Services credentials
// // This requires a key corresponding to the service being used (i.e. text-analytics, etc)
// let credentials = new CognitiveServicesCredentials(CONFIG.cognitive.face.key);

// var face1Id;
// var face2Id;

// const FaceAPIClient = require('azure-cognitiveservices-face');
// let client = new FaceAPIClient(credentials, "westcentralus");



// COGNITIVE.verifyFacesMatch(
//     CONFIG, 
//     'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2a776382d99c26b41b642f.jpg', 
//     'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2a6aa51783db1c04f7db1c.jpg', function(err, result){
//         if(err){
//             console.log(err);
//         }else{
//             console.log(`The match is : ${result.isIdentical}`);
//         }
//     });

// COGNITIVE.detectFace(
//     CONFIG,
//     'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2a776382d99c26b41b642f.jpg',
//      function(err, result){
//         if(err){
//             console.log(err);
//         }else{
//             console.log(result[0].faceId);
//             console.log(result[0].faceRectangle);
//         }
// });

COGNITIVE.createThumbnail(CONFIG, 'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2d09452f648b0744ac03bf.jpg', function(err, result){
    if(err){
        console.log(err);
    }else{
        console.log(`Generated thumbnail at ${result}.`);
    }
});

// 'use strict';

// const request = require('request');

// // Replace <Subscription Key> with your valid subscription key.
// const subscriptionKey = '7d13f54dbf0c4190befcca1b8d4d88d6';

// // You must use the same location in your REST call as you used to get your
// // subscription keys. For example, if you got your subscription keys from
// // westus, replace "westcentralus" in the URL below with "westus".
// const uriBase = 'https://eastus.api.cognitive.microsoft.com/vision/v2.0/generateThumbnail';

// const imageUrl = 'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2b15837ba8bd6c0c299d4d.jpg';
// //const imageUrl = 'https://iheaq4y36kzwy.blob.core.windows.net/pics/5b2d09452f648b0744ac03bf.jpg';

// // Request parameters.
// const params = {
//     'width': '300',
//     'height': '200',
//     'smartCropping': 'true'
// };

// const options = {
//     uri: uriBase,
//     qs: params,
//     body: '{"url": ' + '"' + imageUrl + '"}',
//     headers: {
//         'Content-Type': 'application/json',
//         'Ocp-Apim-Subscription-Key': subscriptionKey
//     },
//     encoding: null
// };

// var file = FS.createWriteStream('temp.jpg');

// request.post(options, (error, response, body) => {
//     if (error) {
//         console.log('Error: ', error);
//         return;
//     } else {
//         FS.writeFile('temp.jpeg', body);
//     }

// });
