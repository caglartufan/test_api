const { User } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage }).single('document');


router.get('/', async (req, res, next) => {
    const documents = await Document.find().sort('uploadDate');
    res.send(documents);
});

router.get('/:userId', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findById(req.params.userId)
        .select('documents')
        .populate('documents');
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    res.send(user.documents);
});

router.post('/:userId', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    let user = await User.findById(req.params.userId)
        .select('documents');
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    return upload(req, res, function(err) {
        if(req.fileValidationError) return next(req.fileValidationError);
        else if(!req.file) return res.status(400).send('Herhangi bir doküman seçilmedi.');
        else if(err instanceof multer.MulterError) return next(err);
        else if(err) return next(err);

        console.log(req.file);

        let document = new Document({
            filename: req.file.filename,
            path: req.file.path,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        document.save()
            .then((savedDocument) => {
                user.documents.push(savedDocument._id);
                user.save()
                    .then(() => res.send(savedDocument));
            });
    });
});

// Doküman düzenlemeyi ayarla
router.put('/:documentId', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değeri uygun değil');

    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let document = await Document.findByIdAndUpdate(req.params.documentId, {
        path: req.file.path
    }, { new: true });
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');

    res.send(document);
});

router.delete('/:documentId', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değerleri uygun değil');

    const document = await Document.findOneAndRemove({ _id: req.params.documentId });
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');

    await User.findOneAndUpdate({ documents: req.params.documentId }, {
        $pull: { documents: req.params.documentId }
    });

    res.send(document);
});

module.exports = router;