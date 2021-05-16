const fs = require('fs');
const path = require('path');
const config = require('config');
const createError = require('./../helpers/createError');
const jsonFileFilter = require('./../helpers/jsonFileFilter');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if(!req.user.username) return cb(new Error('Dokümanın yükleneceği klasör için isim belirtilmemiş.'), null);
        let uploadDestination = path.join(process.cwd(), config.get('diskStorage.destination'), req.user.username);
        fs.access(uploadDestination, (err) => {
            if(err) {
                // Directory with username doesn't exist in uploads folder, so create one
                fs.mkdir(uploadDestination, (err) => {
                    if(err) return cb(err, null);
                    cb(null, uploadDestination);
                });
            } else {
                // Directory with username exists
                cb(null, uploadDestination);
            }
        });
    },
    filename: function(req, file, cb) {
        cb(null, `${file.originalname.replace('.json', '')}--${Date.now()}.json`);
    }
});

module.exports = function(req, res, next) {
    multer({ storage: storage, fileFilter: jsonFileFilter }).single('document')(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(createError(req.fileValidationError.message, 400));
        else if(!req.file) return res.status(400).send(createError('Herhangi bir doküman seçilmedi.', 400));
        else if(err instanceof multer.MulterError) return res.status(500).send(createError(err.message, 500));
        else if(err) return res.status(500).send(createError(err, 500));
        else next();
    });
}