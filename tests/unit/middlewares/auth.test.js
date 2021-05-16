const auth = require('../../../middlewares/auth');
const { User } = require('../../../models/user');
const mongoose = require('mongoose');

describe('auth middleware', () => {
    it('should populate req.user with the payload of a valid JWT', () => {
        const user = {
            _id: mongoose.Types.ObjectId().toHexString(),
            username: 'user',
            plan: 'free'
        };
        const token = new User(user).generateAuthToken();
        const req = {
            header: jest.fn().mockReturnValue(token)
        };
        const next = jest.fn();
        const res = {};
    
        auth(req, res, next);

        expect(req.user).toMatchObject(user);
    });
});