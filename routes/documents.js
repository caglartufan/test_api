const { User } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const multer = require('multer');
const jsonFileFilter = require('./../helpers/jsonFileFilter');
const createError = require('./../helpers/createError');
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

/**
 * @api {get} /documents/mine 1. Request the authorized user's documents as a list
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token.
 * @apiName GetMine
 * @apiGroup Documents
 *
 * @apiSuccess {Object[]} documents Documents of authorized user.
 * @apiSuccess {String} documents._id ObjectId of the document.
 * @apiSuccess {String} documents.filename Name of the file saved in the disk storage.
 * @apiSuccess {String} documents.path Path to the document.
 * @apiSuccess {Number} documents.size Size of the document in bytes.
 * @apiSuccess {String} documents.uploadDate Upload date of the document.
 * @apiSuccess {Number} documents.__v Version of the document object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "_id": "609c424a2cee6929d4acfdc2",
 *         "filename": "johndoe--1620853594797.json",
 *         "path": "/uploads/n3pix/johndoe--1620853594797.json",
 *         "size": 173
 *         "uploadDate": "2021-05-12T21:02:02.126Z",
 *         "__v": 0
 *       },
 *       {
 *         "_id": "609c424a2cee6929d4acfdc3",
 *         "filename": "johndoe--1620853596061.json",
 *         "path": "/uploads/n3pix/johndoe--1620853596061.json",
 *         "size": 185
 *         "uploadDate": "2021-05-12T22:02:02.126Z",
 *         "__v": 0
 *       }
 *     ]
 */
router.get('/mine', auth, async (req, res, next) => {
    const { documents } = await User.findById(req.user._id)
        .select('documents')
        .populate('documents');
    res.send(documents);
});

/**
 * @api {get} /documents/mine/:documentId 2. Request the authorized user's document with provided document ObjectId
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token.
 * @apiName GetMineById
 * @apiGroup Documents
 *
 * @apiSuccess {String} _id ObjectId of the document.
 * @apiSuccess {String} filename Name of the file saved in the disk storage.
 * @apiSuccess {String} path Path to the document.
 * @apiSuccess {Number} size Size of the document in bytes.
 * @apiSuccess {String} uploadDate Upload date of the document.
 * @apiSuccess {Number} __v Version of the document object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "filename": "johndoe--1620853594797.json",
 *       "path": "/uploads/n3pix/johndoe--1620853594797.json",
 *       "size": 173
 *       "uploadDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 * 
 * @apiError documentIdNotValid Given document ObjectId is not a valid ObjectId.
 * @apiError documentNotFound Document with given ObjectId could not found.
 *
 * @apiErrorExample documentIdNotValid:
 *     HTTP/1.1 400 documentIdNotValid
 *     {
 *       "error": {
 *         "message": "Girilen ID değeri uygun değil.",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample documentNotFound:
 *     HTTP/1.1 404 documentNotFound
 *     {
 *       "error": {
 *         "message": "Verilen ID değerine sahip doküman bulunamadı.",
 *         "statusCode": 404
 *       }
 *     }
 */
router.get('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));

    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    res.send(document);
});

/**
 * @api {post} /documents/mine/ 3. Create a new document for authorized user
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token
 * @apiName PostMine
 * @apiGroup Documents
 *
 * @apiParam {File} document Select the JSON file to create a document.
 * 
 * @apiSuccess {String} _id ObjectId of the document.
 * @apiSuccess {String} filename Name of the file saved in the disk storage.
 * @apiSuccess {String} path Path to the document.
 * @apiSuccess {Number} size Size of the document in bytes.
 * @apiSuccess {String} uploadDate Upload date of the document.
 * @apiSuccess {Number} __v Version of the document object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "filename": "johndoe--1620853594797.json",
 *       "path": "/uploads/n3pix/johndoe--1620853594797.json",
 *       "size": 173
 *       "uploadDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 * 
 * @apiError fileNotSelected No file selected in form file input.
 *
 * @apiErrorExample fileNotSelected:
 *     HTTP/1.1 400 fileNotSelected
 *     {
 *       "error": {
 *         "message": "Herhangi bir doküman seçilmedi.",
 *         "statusCode": 400
 *       }
 *     }
 */
router.post('/mine', auth, async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .select('documents');

    req.fileUploadFolderName = req.user.username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(createError(req.fileValidationError.message, 400));
        else if(!req.file) return res.status(400).send(createError('Herhangi bir doküman seçilmedi.', 400));
        else if(err instanceof multer.MulterError) return res.status(500).send(createError(err, 500));
        else if(err) return res.status(500).send(createError(err, 500));

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

/**
 * @api {put} /documents/mine/:documentId 4. Update an existing document of authorized user
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token.
 * @apiName PutMine
 * @apiGroup Documents
 *
 * @apiParam {File} document Select the JSON file to update with existing document that is provided by documet ObjectId.
 * 
 * @apiSuccess {String} _id ObjectId of the document.
 * @apiSuccess {String} filename Name of the upldated file saved in the disk storage.
 * @apiSuccess {String} path Path to the updated document.
 * @apiSuccess {Number} size Size of the updated document in bytes.
 * @apiSuccess {String} uploadDate Upload date (not updated) of the updated document.
 * @apiSuccess {Number} __v Version of the document object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "filename": "johndoe--1620853594797.json",
 *       "path": "/uploads/n3pix/johndoe--1620853594797.json",
 *       "size": 173
 *       "uploadDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 * 
 * @apiError documentIdNotValid Given document ObjectId is not a valid ObjectId.
 * @apiError documentNotFound Document with given ObjectId could not found.
 * @apiError fileNotSelected No file selected in form file input.
 *
 * @apiErrorExample documentIdNotValid:
 *     HTTP/1.1 400 documentIdNotValid
 *     {
 *       "error": {
 *         "message": "Girilen ID değeri uygun değil.",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample documentNotFound:
 *     HTTP/1.1 404 documentNotFound
 *     {
 *       "error": {
 *         "message": "Verilen ID değerine sahip doküman bulunamadı.",
 *         "statusCode": 404
 *       }
 *     }
 * @apiErrorExample fileNotSelected:
 *     HTTP/1.1 400 fileNotSelected
 *     {
 *       "error": {
 *         "message": "Herhangi bir doküman seçilmedi.",
 *         "statusCode": 400
 *       }
 *     }
 */
router.put('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));
    
    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı', 404));

    req.fileUploadFolderName = req.user.username;

    upload(req, res, function(err) {
        if(req.fileValidationError) return res.status(400).send(createError(req.fileValidationError.message, 400));
        else if(!req.file) return res.status(400).send(createError('Herhangi bir doküman seçilmedi.', 400));
        else if(err instanceof multer.MulterError) return res.status(500).send(createError(err, 500));
        else if(err) return res.status(500).send(createError(err, 500));

        let oldFilePathInDiskStorage = path.join(process.cwd(), document.path);

        // Check if the old file exists or not
        fs.access(oldFilePathInDiskStorage, (err) => {
            // If the old file exist remove it
            if(!err) {
                fs.unlink(oldFilePathInDiskStorage, (err) => {
                    if(err) return res.status(500).send(createError('Düzenlenmek istenen dökümanın eski sürümü silinemedi.', 500));
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

/**
 * @api {delete} /documents/mine/:documentId 5. Remove a document of authorized user
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token.
 * @apiName RemoveMine
 * @apiGroup Documents
 * 
 * @apiSuccess {String} _id ObjectId of the removed document
 * @apiSuccess {String} filename Name of the file removed in the disk storage.
 * @apiSuccess {String} path Path to the removed document.
 * @apiSuccess {Number} size Size of the removed document in bytes.
 * @apiSuccess {String} uploadDate Upload date (not remove date) of the removed document.
 * @apiSuccess {Number} __v Version of the removed document object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "filename": "johndoe--1620853594797.json",
 *       "path": "/uploads/n3pix/johndoe--1620853594797.json",
 *       "size": 173
 *       "uploadDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 * 
 * @apiError documentIdNotValid Given document ObjectId is not a valid ObjectId.
 * @apiError documentNotFound Document with given ObjectId could not found.
 *
 * @apiErrorExample documentIdNotValid:
 *     HTTP/1.1 400 documentIdNotValid
 *     {
 *       "error": {
 *         "message": "Girilen ID değeri uygun değil.",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample documentNotFound:
 *     HTTP/1.1 404 documentNotFound
 *     {
 *       "error": {
 *         "message": "Verilen ID değerine sahip doküman bulunamadı.",
 *         "statusCode": 404
 *       }
 *     }
 */
router.delete('/mine/:documentId', auth, async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı', 404));

    const document = await Document.findOneAndRemove({ _id: req.params.documentId });
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));
    
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