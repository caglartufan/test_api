const { User, validate } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const auth = require('./../middlewares/auth');
const admin = require('./../middlewares/admin');
const express = require('express');
const router = express.Router();

// User routes 
router.get('/me', auth, async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .select('-password -isAdmin');
    res.send(user);
});

router.put('/me', auth, async (req, res, next) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    
    let user = await User.findOne({ username: req.body.username });
    if(user && req.user._id != user._id) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = await User.findById(req.user._id);
    if(!user) return res.status(404).send('Düzenlenmek istenen kullanıcı bulunamadı.');

    user.username = req.body.username;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    try {
        user = await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'username', 'joinDate']));
    } catch(exception) {
        res.status(400).send(exception.errors[Object.keys(exception.errors)[0]].properties.message);
    }
});

// Administration routes
router.get('/', [auth, admin], async (req, res, next) => {
    const users = await User.find().sort('name');
    res.send(users);
});

router.get('/:id', [auth, admin], async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    res.send(user);
});

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