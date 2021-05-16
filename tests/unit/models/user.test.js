const mongoose = require('mongoose');
const { User, validate } = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');

describe('user.generateAuthToken', () => {
    it('should return a valid JWT', () => {
        const payload = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            username: 'test',
            plan: 'free'
        };
        const user = new User(payload);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwt.privateKey'));

        expect(decoded).toMatchObject(payload);
    });
});

describe('user.validate', () => {
    it('should return an object with value property undefined if user parameter is not provided', () => {
        const result = validate();
        expect(result).toEqual({ value: undefined });
    });
});