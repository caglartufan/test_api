const { User } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const multer = require('multer');
const jsonFileFilter = require('./../helpers/jsonFileFilter');
const path = require('path');
const fs = require('fs');
const auth = require('./../middlewares/auth');
const admin = require('./../middlewares/admin');
const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if(!req.fileUploadFolderName) return cb(new Error('Dokümanın yükleneceği klasör için isim belirtilmemiş.'), null);
        let uploadDestination = path.join(process.cwd(), 'uploads', req.fileUploadFolderName);
        fs.access(uploadDestination, (err) => {
            if(err) {
                // Directory with username doesn't exist in uploads folder, so create one
                fs.mkdir(uploadDestination, (err) => {
                    if(err) throw err;
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
const upload = multer({ storage: storage, fileFilter: jsonFileFilter }).single('document');

// User routes
router.get('/mine', auth, async (req, res, next) => {
    const { documents } = await User.findById(req.user._id)
        .select('documents')
        .populate('documents');
    res.send(documents);
});

router.get('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı');

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı');

    res.send(document);
});

router.post('/mine', auth, async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .select('documents');

    req.fileUploadFolderName = req.user.username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(req.fileValidationError.message);
        else if(!req.file) return res.status(400).send('Herhangi bir doküman seçilmedi.');
        else if(err instanceof multer.MulterError) return res.status(500).send(err);
        else if(err) return res.status(500).send(err);

        let document = new Document({
            filename: req.file.filename,
            path: `/uploads/${req.fileUploadFolderName}/${req.file.filename}`,
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

router.put('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değeri uygun değil.');
    
    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı');

    req.fileUploadFolderName = req.user.username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(req.fileValidationError.message);
        else if(!req.file) return res.status(400).send('Herhangi bir doküman seçilmedi.');
        else if(err instanceof multer.MulterError) return res.status(500).send(err);
        else if(err) return res.status(500).send(err);

        let oldFilePathInDiskStorage = path.join(process.cwd(), document.path);

        // Check if the old file exists or not
        fs.access(oldFilePathInDiskStorage, (err) => {
            // If the old file exist remove it
            if(!err) {
                fs.unlink(oldFilePathInDiskStorage, (err) => {
                    if(err) return res.status(500).send('Düzenlenmek istenen dökümanın eski sürümü silinemedi.');
                });
            }

            document.filename = req.file.filename;
            document.path = `/uploads/${req.fileUploadFolderName}/${req.file.filename}`;
            document.size = req.file.size;

            document.save()
                .then((savedDocument) => res.send(savedDocument));
        });
    });
});

router.delete('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı');

    const document = await Document.findOneAndRemove({ _id: req.params.documentId });
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');
    
    user.documents.splice(user.documents.indexOf(req.params.documentId), 1);

    let deletedFilePathInDiskStorage = path.join(process.cwd(), document.path);

    // Remove the deleted document in disk
    fs.access(deletedFilePathInDiskStorage, (err) => {
        if(!err) {
            fs.unlink(deletedFilePathInDiskStorage, (err) => {
                if(err) res.status(500).send('Silinmek istenen doküman diskten silinemedi.');
            });
        }

        user.save()
            .then(() => res.send(document));
    });
});

// Administration routes
router.get('/', [auth, admin], async (req, res, next) => {
    const documents = await Document.find().sort('uploadDate');
    res.send(documents);
});

router.get('/:userId', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findById(req.params.userId)
        .select('documents')
        .populate('documents');
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    res.send(user.documents);
});

router.post('/:userId', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.userId)) return res.status(400).send('Girilen ID değeri uygun değil.');

    let user = await User.findById(req.params.userId)
        .select('documents username');
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    req.fileUploadFolderName = user.username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(req.fileValidationError.message);
        else if(!req.file) return res.status(400).send('Herhangi bir doküman seçilmedi.');
        else if(err instanceof multer.MulterError) return res.status(500).send(err);
        else if(err) return res.status(500).send(err);

        let document = new Document({
            filename: req.file.filename,
            path: `/uploads/${req.fileUploadFolderName}/${req.file.filename}`,
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

router.put('/:documentId', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değeri uygun değil');

    let document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');

    let { username } = await User.findOne({ documents: req.params.documentId })
        .select('username');
    
    req.fileUploadFolderName = username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(req.fileValidationError.message);
        else if(!req.file) return res.status(400).send('Herhangi bir doküman seçilmedi.');
        else if(err instanceof multer.MulterError) return res.status(500).send(err);
        else if(err) return res.status(500).send(err);

        let oldFilePathInDiskStorage = path.join(process.cwd(), document.path);

        // Check if the old file exists or not
        fs.access(oldFilePathInDiskStorage, (err) => {
            // If the old file exist remove it
            if(!err) {
                fs.unlink(oldFilePathInDiskStorage, (err) => {
                    if(err) return res.status(500).send('Düzenlenmek istenen dökümanın eski sürümü silinemedi.');
                });
            }

            document.filename = req.file.filename;
            document.path = `/uploads/${req.fileUploadFolderName}/${req.file.filename}`;
            document.size = req.file.size;

            document.save()
                .then((savedDocument) => res.send(savedDocument));
        });
    });
});

router.delete('/:documentId', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send('Girilen ID değerleri uygun değil');

    const document = await Document.findOneAndRemove({ _id: req.params.documentId });
    if(!document) return res.status(404).send('Verilen ID değerine sahip doküman bulunamadı.');

    await User.findOneAndUpdate({ documents: req.params.documentId }, {
        $pull: { documents: req.params.documentId }
    });

    let deletedFilePathInDiskStorage = path.join(process.cwd(), document.path);

    // Remove the deleted document in disk
    fs.access(deletedFilePathInDiskStorage, (err) => {
        if(!err) {
            fs.unlink(deletedFilePathInDiskStorage, (err) => {
                if(err) res.status(500).send('Silinmek istenen doküman diskten silinemedi.');
            });
        }

        res.send(document);
    });
});

module.exports = router;