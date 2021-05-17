const jwt = require('jsonwebtoken');
const config = require('config');
const createError = require('../helpers/createError');

module.exports = function(req, res, next) {
    try {
        const token = req.header('x-auth-token');

        if(!token) return res.status(401).send(createError('Access denied. No token provided.', 401));

        const decoded = jwt.verify(token, config.get('jwt.privateKey'));
        req.user = decoded;
        next();
    } catch(exception) {
        res.status(400).send(createError('Invalid token.'));
    }
}