const jwt = require('jsonwebtoken');
const config = require('config');
const path = require('path');
const { mbToBytes } = require('./../helpers/sizeConverter');
const readFolderSize = require('./../helpers/readFolderSize');
const Joi = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 30,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9]+$/.test(v);
            },
            message: 'Kullanıcı adınız sadece harf ve rakamlardan oluşmalıdır'
        },
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 1024
    },
    plan: {
        type: String,
        enum: Object.keys(config.get('plans')),
        default: 'free'
    },
    documents: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Document'
    }],
    joinDate: {
        type: Date,
        default: Date.now
    }
});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({
        _id: this._id,
        plan: this.plan,
        username: this.username
    }, config.get('jwt.privateKey'));
    return token;
}

userSchema.methods.leftDiskSpace = function(callback) {
    let userTotalDiskSpaceInBytes = mbToBytes(Number(config.get(`plans.${this.plan}.diskSpace`)));
    if(!this.documents.length) return callback(null, userTotalDiskSpaceInBytes);
    let uploadDestination = path.join(process.cwd(), 'uploads', this.username);
    readFolderSize(uploadDestination)
        .then((size) => callback(null, userTotalDiskSpaceInBytes - size))
        .catch((err) => callback(err, null));
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        password: Joi.string().min(4).max(255).required()
    });

    return schema.validate(user);
}

exports.User = User;
exports.validate = validateUser;