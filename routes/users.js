const { User, validate } = require('../models/user');
const { Document } = require('../models/document');
const mongoose = require('mongoose');
const Joi = require('joi');
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
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(user) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = new User({
        username: req.body.username,
        password: req.body.password
    });
    user = await user.save();

    res.send(user);
});

router.put('/:id', async (req, res, next) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send('Girilen ID değeri uygun değil.');

    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({ username: req.body.username });
    if(user && user._id != req.params.id) return res.status(400).send('Girmiş olduğunuz kullanıcı adı kullanımda.');

    user = await User.findByIdAndUpdate(req.params.id, {
        username: req.body.username,
        password: req.body.password
    }, { new: true });
    if(!user) return res.status(404).send('Verilen ID değerine sahip kullanıcı bulnamadı.');

    res.send(user);
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

module.exports = router;