const fs = require('fs');
const path = require('path');
const jsonFileFilter = require('./../helpers/jsonFileFilter');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if(!req.user.username) return cb(new Error('Dokümanın yükleneceği klasör için isim belirtilmemiş.'), null);
        let uploadDestination = path.join(process.cwd(), 'uploads', req.user.username);
        fs.access(uploadDestination, (err) => {
            if(err) {
                // Directory with username doesn't exist in uploads folder, so create one
                fs.mkdir(uploadDestination, (err) => {
                    if(err) cb(err, null);
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

module.exports = multer({ storage: storage, fileFilter: jsonFileFilter }).single('document');