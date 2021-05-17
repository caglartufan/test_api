const fs = require('fs');

module.exports = function(filePath) {
    return new Promise((resolve, reject) => {
        fs.promises.access(filePath)
            .then(() => {
                fs.promises.unlink(filePath)
                    .then(() => resolve())
                    .catch((err) => reject(err));
            })
            .catch((err) => {
                resolve();
            });
    });
}