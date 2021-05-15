const { User, validate } = require('../models/user');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const auth = require('./../middlewares/auth');
const createError = require('./../helpers/createError');
const { bytesToMb } = require('./../helpers/sizeConverter');
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
 *       "plan": "free",
 *       "documents": [
 *         "609c424a2cee6929d4acfdc3",
 *         "609c424a2cee6929d4acfdc4"
 *       ],
 *       "joinDate": "2021-05-12T21:02:02.126Z",
 *       "__v": 0
 *     }
 */
router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password -isAdmin');
    res.send(user);
});


/**
 * @api {get} /users/me/left-disk-space 2. Request the authorized user's left disk space
 * @apiVersion 0.1.0
 * @apiHeader {String} x-auth-token JWT authorization token
 * @apiName GetLeftDiskSpace
 * @apiGroup Users
 *
 * @apiParam {String} round Set round query parameter to <code>false</code> if you want <code>leftDiskSpaceInMbs</code> value to not rounded.
 * 
 * @apiSuccess {Number} leftDiskSpaceInBytes Authorized user's left disk space in bytes.
 * @apiSuccess {Number} leftDiskSpaceInMbs Authorized user's left disk space in MBs.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "leftDiskSpaceInBytes": 52428203,
 *       "leftDiskSpaceInMbs": 50
 *     }
 */
router.get('/me/left-disk-space', auth, async (req, res) => {
    const user = await User.findById(req.user._id);

    let roundFlag = req.query.round && req.query.round.trim().toLowerCase() === 'false' ? false : true;

    user.leftDiskSpace(function(err, leftSpace) {
        if(err) return res.status(400).send(createError(err.message));
        res.send({
            leftDiskSpaceInBytes: leftSpace,
            leftDiskSpaceInMbs: bytesToMb(leftSpace, roundFlag)
        });
    });
});

/**
 * @api {put} /users/me 3. Update the authorized user
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
 *       "plan": "free",
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
router.put('/me', auth, async (req, res) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    let user = await User.findOne({ username: req.body.username });
    if(user && req.user._id != user._id) return res.status(400).send(createError('Girmiş olduğunuz kullanıcı adı kullanımda.', 400));

    user = await User.findById(req.user._id);
    if(!user) return res.status(404).send(createError('Düzenlenmek istenen kullanıcı bulunamadı.', 404));

    let oldUsername = user.username;

    user.username = req.body.username;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    try {
        user = await user.save();
        
        if(user.documents.length) await fs.promises.rename(path.join(process.cwd(), 'uploads', oldUsername), path.join(process.cwd(), 'uploads', user.username));

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'username', 'joinDate']));
    } catch(exception) {
        res.status(400).send(createError(exception.errors[Object.keys(exception.errors)[0]].properties.message, 400));
    }
});

module.exports = router;