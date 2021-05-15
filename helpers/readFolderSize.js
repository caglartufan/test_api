const fs = require('fs');
const path = require('path');
const async = require('async');

function readFolderSize(folderPath) {
    return fs.promises.access(folderPath)
        .then(() => {
            return fs.promises.readdir(folderPath);
        })
        .then((files) => {
            return new Promise((resolve, reject) => {
                let size = 0;
                async.each(files, function(file, next) {
                    console.log(`Reading: ${file}`);
                    fs.stat(path.join(folderPath, file), (err, stats) => {
                        if(err) {
                            next(err);
                        } else {
                            size += stats.size;
                            next();
                        }
                    });
                }, function(err) {
                    if(err) reject(err);
                    else resolve(size);
                });
            });
        })
        .then((size) => {
            return size;
        });
}

module.exports = readFolderSize;