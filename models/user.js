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
    documents: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Document'
    }],
    joinDate: {
        type: Date,
        default: Date.now
    }
});

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