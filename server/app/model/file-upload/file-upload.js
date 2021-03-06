
var fs = require('fs');
var Grid = require('gridfs-stream');
var appConfig = require('_pr/config');
var logger = require('_pr/logger')(module);
var gfs =null;
var mongoDbClient = require('mongodb');
mongoDbClient.connect('mongodb://'+ appConfig.db.host + ':' + appConfig.db.port + '/' + appConfig.db.dbName, function(err, db) {
    if (err) {
        throw "unable to connect to mongodb"
        return;
    }
    gfs = Grid(db, mongoDbClient);
});

var fileUpload = module.exports = {};

fileUpload.uploadFile = function uploadFile(filename, filePath,fileId, callback){
    var writeStream = gfs.createWriteStream({
        _id: fileId,
        filename: filename,
        mode:'w',
        content_type: 'plain/text'
    });
    fs.createReadStream(filePath).pipe(writeStream).on('error', function (err) {
        logger.error(err);
        callback(err,null);
    }).on('finish', function() {
        callback(null,fileId)
    });
};

fileUpload.getFileByFileId = function getFileByFileId(fileId, callback){
    gfs.findOne({
        _id: fileId
    }, function (err, file) {
        if (err) {
            callback(err, null);
        }
        callback(null,file);
    });
};

fileUpload.getReadStreamFileByFileId = function getFileByFileId(fileId, callback){
    var buffer = '';
    gfs.findOne({
        _id: fileId
    }, function (err, file) {
        var readStream = gfs.createReadStream({
            _id: file._id
        });
        readStream.on("data", function (chunk) {
            buffer += chunk;
        });
        readStream.on("end", function () {
            callback(null, {fileName:file.filename,fileData:buffer})
        });
        readStream.on("error", function (err) {
            callback(err, null)
        });
    });
};

fileUpload.removeFileByFileId = function removeFileByFileId(fileId, callback){
    gfs.files.remove({
        _id: fileId
    }, function (err, file) {
        if (err) {
            callback(err, null);
        }else{
            callback(null, file);
        }
    });
};
