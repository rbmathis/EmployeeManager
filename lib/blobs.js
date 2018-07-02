var CONFIG = require('../config');
const fs = require('fs');
const azureBlobs = require('azure-storage');

exports.moveLocalFileToBlobStorage = function (localImage, blobName, callback) {

    var blobs = azureBlobs.createBlobService(CONFIG.blobs.connectionString);
    blobs.createBlockBlobFromLocalFile(CONFIG.blobs.containerName, blobName, localImage.path, function (err, blob) {
        if (err) {
            console.log(`Error while uploading: ${localImage.path}`);
            callback(err);
        } else {
            console.log(`Uploaded: ${localImage.path} to ${blobName}`);

            //delete the local file
            fs.unlinkSync(localImage.path);
            console.log(`Deleted: ${localImage.path}`);

            callback(null, blob);


        }
    });
}

exports.deleteBlob = function (imagePath, callback) {

    var blobs = azureBlobs.createBlobService(CONFIG.blobs.connectionString);
    blobs.deleteBlobIfExists(CONFIG.blobs.containerName, imagePath, function (err, response) {
        if (err) {
            console.log(`Error while deleting: ${imagePath}`);
            callback(err);
        } else {
            console.log(`Deleted: ${imagePath}`);
            if (callback) {
                callback(null, response);
            }

        }
    });
}


exports.copyBlob = function (fromUrl, toContainer, toName, callback) {

    var blobs = azureBlobs.createBlobService(CONFIG.blobs.connectionString);
    blobs.startCopyBlob(fromUrl, toContainer, toName, function (err, blob) {
        if (err) {
            console.log(`Error while copying from ${fromUrl} to ${toContainer}/${toName}`);
            callback(err);
        } else {
            console.log(`Successfully copied from ${fromUrl} to ${toContainer}/${toName}`);
            if (callback) {
                callback(null, blob);
            }

        }
    });
}