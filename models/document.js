const Joi = require('joi');
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    path: {
        type: String,
        required: true
    },
    encoding: {
        type: String
    },
    mimetype: {
        type: String
    },
    size: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const Document = mongoose.model('Document', documentSchema);

exports.Document = Document;