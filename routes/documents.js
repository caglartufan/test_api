const { User } = require('../models/user');
const { Document } = require('../models/document');
const isValidObjectId = require('./../helpers/isValidObjectId');
const createError = require('./../helpers/createError');
const path = require('path');
const fs = require('fs');
const auth = require('./../middlewares/auth');
const uploadFile = require('./../middlewares/uploadFile');
const express = require('express');
const router = express.Router();

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
router.get('/mine', auth, async (req, res) => {
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
router.get('/mine/:documentId', auth, async (req, res) => {
    if(!isValidObjectId(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));

    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    res.send(document);
});

/**
 * @api {post} /documents/mine/ 4. Create a new document for authorized user
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
 * @apiError planLimitExceeded User's current plan disk space is exceeded.
 *
 * @apiErrorExample fileNotSelected:
 *     HTTP/1.1 400 fileNotSelected
 *     {
 *       "error": {
 *         "message": "Herhangi bir doküman seçilmedi.",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample planLimitExceeded:
 *     HTTP/1.1 403 planLimitExceeded
 *     {
 *       "error": {
 *         "message": "Your plan's disk space is exceeded.",
 *         "statusCode": 403
 *       }
 *     }
 */
router.post('/mine', [auth, uploadFile], async (req, res) => {
    const user = await User.findById(req.user._id);

    user.leftDiskSpace(function(err, leftSpace) {
        if(err) {
            return res.status(400).send(createError(err.message, 400));
        } else {
            if(leftSpace < 0) {
                fs.access(req.file.path, (err) => {
                    if(err) {
                        res.status(403).send(createError('Your plan\'s disk space is exceeded.', 403));
                    } else {
                        fs.unlink(req.file.path, (err) => {
                            if(err) res.status(500).send('Silinmek istenen doküman diskten silinemedi.');
                            else res.status(403).send(createError('Your plan\'s disk space is exceeded.', 403));
                        });
                    }
                });
            } else {
                let document = new Document({
                    filename: req.file.filename,
                    path: `/uploads/${req.user.username}/${req.file.filename}`,
                    size: req.file.size
                });
        
                document.save()
                    .then((savedDocument) => {
                        user.documents.push(savedDocument._id);
                        user.save()
                            .then(() => res.send(savedDocument));
                    });
            }
        }
    });
});

/**
 * @api {put} /documents/mine/:documentId 5. Update an existing document of authorized user
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
 * @apiError planLimitExceeded User's current plan disk space is exceeded.
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
 * @apiErrorExample planLimitExceeded:
 *     HTTP/1.1 403 planLimitExceeded
 *     {
 *       "error": {
 *         "message": "Your plan's disk space is exceeded.",
 *         "statusCode": 403
 *       }
 *     }
 */
router.put('/mine/:documentId', [auth, uploadFile], async (req, res) => {
    if(!isValidObjectId(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));
    
    const document = await Document.findById(req.params.documentId);
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));

    const user = await User.findById(req.user._id);
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı', 404));

    user.leftDiskSpace(function(err, leftSpace) {
        if(err) {
            return res.status(400).send(createError(err.message, 400));
        } else {
            // Check if the user's directory size with uploaded file minus old file size
            // exceeds the limits of user
            if((leftSpace + document.size) < 0) {
                fs.access(req.file.path, (err) => {
                    if(!err) {
                        fs.unlink(req.file.path, (err) => {
                            if(err) res.status(500).send('Silinmek istenen doküman diskten silinemedi.');
                            else res.status(403).send(createError('Your plan\'s disk space is exceeded.', 403));
                        });
                    }
                });
            } else {
                let oldFilePathInDiskStorage = path.join(process.cwd(), document.path);

                // Check if the old file exists or not
                fs.access(oldFilePathInDiskStorage, (err) => {
                    if(err) {
                        document.filename = req.file.filename;
                        document.path = `/uploads/${req.user.username}/${req.file.filename}`;
                        document.size = req.file.size;
            
                        document.save()
                            .then((savedDocument) => res.send(savedDocument));
                    } else {
                        // If the old file exist, remove it
                        fs.unlink(oldFilePathInDiskStorage, (err) => {
                            if(err) {
                                return res.status(500).send(createError('Düzenlenmek istenen dökümanın eski sürümü silinemedi.', 500));
                            } else {
                                document.filename = req.file.filename;
                                document.path = `/uploads/${req.user.username}/${req.file.filename}`;
                                document.size = req.file.size;
            
                                document.save()
                                    .then((savedDocument) => res.send(savedDocument));
                            }
                        });
                    }
                });
            }
        }
    });
});

/**
 * @api {delete} /documents/mine/:documentId 6. Remove a document of authorized user
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
router.delete('/mine/:documentId', auth, async (req, res) => {
    if(!isValidObjectId(req.params.documentId)) return res.status(400).send(createError('Girilen ID değeri uygun değil.', 400));

    const user = await User.findById(req.user._id)
        .select('documents');
    if(user.documents.indexOf(req.params.documentId) < 0) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı', 404));

    const document = await Document.findOneAndRemove({ _id: req.params.documentId });
    if(!document) return res.status(404).send(createError('Verilen ID değerine sahip doküman bulunamadı.', 404));
    
    user.documents.splice(user.documents.indexOf(req.params.documentId), 1);

    let deletedFilePathInDiskStorage = path.join(process.cwd(), document.path);

    // Remove the deleted document in disk
    fs.access(deletedFilePathInDiskStorage, (err) => {
        if(err) {
            user.save().then(() => res.send(document));
        } else {
            fs.unlink(deletedFilePathInDiskStorage, (err) => {
                if(err) res.status(500).send('Silinmek istenen doküman diskten silinemedi.');
                else user.save().then(() => res.send(document));
            });
        }
    });
});

module.exports = router;