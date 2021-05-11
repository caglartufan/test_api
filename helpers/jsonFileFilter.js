module.exports = function(req, file, cb) {
    if (!file.originalname.match(/\.(json)$/)) {
        let error = new Error('Doküman olarak sadece JSON dosyası yüklenebilir.');
        req.fileValidationError = error;
        return cb(error, false);
    }
    cb(null, true);
}