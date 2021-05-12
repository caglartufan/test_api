const { User, validate } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    const users = await User.find().sort('name');
    res.send(users);
});

router.get('/:id', async (req, res, next) => {
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

    user = new User(_.pick(req.body, ['username', 'password']));
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Catch validation errors
    try{
        user = await user.save();
        res.send(user);
    } catch(exception) {
        res.status(400).send(exception.errors[Object.keys(exception.errors)[0]].properties.message);
    }
});

router.put('/:id', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(user && user._id != req.params.id) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = await User.findById(req.params.id);
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulnamadı.');

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

router.delete('/:id', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const user = await User.findOneAndRemove({ _id: req.params.id });
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulunamadı.');

    if(user.documents.length) {
        await Document.deleteMany({ _id: { $in: user.documents } });
    }

    res.send(user);
});

router.post('/validate', async (req, res, next) => {
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(!user) return res.status(400).send('Kullanıcı adı ya da şifre geçersiz.');

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password)
    if(!isPasswordCorrect) return res.status(400).send('Kullanıcı adı ya da şifre geçersiz.');

    res.send(user);
});

module.exports = router;