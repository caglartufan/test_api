const { User, validate } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const auth = require('./../middlewares/auth');
const admin = require('./../middlewares/admin');
const createError = require('./../helpers/createError');
const express = require('express');
const router = express.Router();

/**
 * @api {get} /users/me 1. Request the authorized user
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token
 * @apiName GetMe
 * @apiGroup Users
 *
 * @apiSuccess {String} _id ObjectId of the authorized user.
 * @apiSuccess {String} username Username of the authorized user.
 * @apiSuccess {String[]} documents Array of document ObjectIds of the authorized user.
 * @apiSuccess {String} joinDate Join date of the authorized user.
 * @apiSuccess {Number} __v Version of the user object.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "username": "johndoe",
 *       "documents": [
 *         "609c424a2cee6929d4acfdc3",
 *         "609c424a2cee6929d4acfdc4"
 *       ],
 *       "joinDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 */
router.get('/me', auth, async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .select('-password -isAdmin');
    res.send(user);
});

/**
 * @api {put} /users/me 2. Update the authorized user
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token
 * @apiName PutMe
 * @apiGroup Users
 * 
 * @apiParam {String} username New username of the user that is authorized.
 * @apiParam {String} password New password of the user that is authorized.
 *
 * @apiSuccess {String} _id ObjectId of the authorized user.
 * @apiSuccess {String} username Username of the authorized user.
 * @apiSuccess {String} joinDate Join date of the authorized user.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "609c424a2cee6929d4acfdc2",
 *       "username": "johndoe",
 *       "joinDate": "2021-05-12T21:02:02.126Z"
 *     }
 *
 * @apiError UsernameInUse Username is already in use.
 * @apiError UserNotFound User with ObjectId provided by authorization token could not found.
 * @apiError ValidationError Given request body fields are not valid. (eg <code>username</code>)
 *
 * @apiErrorExample UsernameInUse:
 *     HTTP/1.1 400 UsernameInUse
 *     {
 *       "error": {
 *         "message": "Girmiş olduğunuz kullanıcı adı kullanımda.",
 *         "statusCode": 400
 *       }
 *     }
 * @apiErrorExample UserNotFound:
 *     HTTP/1.1 404 UserNotFound
 *     {
 *       "error": {
 *         "message": "Düzenlenmek istenen kullanıcı bulunamadı.",
 *         "statusCode": 404
 *       }
 *     }
 * @apiErrorExample ValidationError:
 *     HTTP/1.1 400 ValidationError
 *     {
 *       "error": {
 *         "message": "Kullanıcı adınız sadece harf ve rakamlardan oluşmalıdır",
 *         "statusCode": 400
 *       }
 *     }
 */
router.put('/me', auth, async (req, res, next) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    let user = await User.findOne({ username: req.body.username });
    if(user && req.user._id != user._id) return res.status(400).send(createError('Girmiş olduğunuz kullanıcı adı kullanımda.', 400));

    user = await User.findById(req.user._id);
    if(!user) return res.status(404).send(createError('Düzenlenmek istenen kullanıcı bulunamadı.', 404));

    user.username = req.body.username;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    try {
        user = await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'username', 'joinDate']));
    } catch(exception) {
        res.status(400).send(createError(exception.errors[Object.keys(exception.errors)[0]].properties.message, 400));
    }
});

/**
 * ADMINISTRATION ROUTE 1
 */
router.get('/', [auth, admin], async (req, res, next) => {
    const users = await User.find().sort('name');
    res.send(users);
});

/**
 * ADMINISTRATION ROUTE 2
 */
router.get('/:id', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    res.send(user);
});

/**
 * ADMINISTRATION ROUTE 3
 */
router.post('/', async (req, res, next) => {
    let { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(user) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = new User({
        username: req.body.username,
        password: req.body.password
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Catch validation errors
    try{
        user = await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'username', 'joinDate']));
    } catch(exception) {
        res.status(400).send(exception.errors[Object.keys(exception.errors)[0]].properties.message);
    }
});

/**
 * ADMINISTRATION ROUTE 4
 */
router.put('/:id', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(user && user._id != req.params.id) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = await User.findById(req.params.id);
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    user.username = req.body.username;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    // Catch validation errors
    try {
        user = await user.save();
        res.send(user);
    } catch(exception) {
        res.status(400).send(exception.errors[Object.keys(exception.errors)[0]].properties.message);
    }
});

/**
 * ADMINISTRATION ROUTE 5
 */
router.delete('/:id', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findOneAndRemove({ _id: req.params.id });
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    if(user.documents.length) {
        await Document.deleteMany({ _id: { $in: user.documents } });
        let userUploadsPath = path.join(process.cwd(), 'uploads', user.username);
        fs.access(userUploadsPath, (err) => {
            if(!err) {
                fs.rm(userUploadsPath, { recursive: true }, (err) => {
                    if(err) throw err;
                });
            }
        });
    }

    res.send(user);
});

module.exports = router;