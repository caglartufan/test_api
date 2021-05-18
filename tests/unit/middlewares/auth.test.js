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
        const mockReq = {
            header: jest.fn().mockReturnValue(token)
        };
        const mockRes = {};
        const mockNext = jest.fn();
    
        auth(mockReq, mockRes, mockNext);

        expect(mockReq.user).toMatchObject(user);
        expect(mockReq.header).toBeCalled();
    });

    it('should call response function with status 400 and return error', () => {
        const mockReq = {
            header: jest.fn().mockReturnValue('1')
        };
        const mockRes = {
            statusCode: 200,
            status: jest.fn().mockImplementation(function(statusCode) {
                this.statusCode = statusCode;
                return this;
            }),
            send: jest.fn().mockImplementation(function(any) {
                return;
            })
        };
        const mockNext = jest.fn();

        auth(mockReq, mockRes, mockNext);

        expect(mockRes.statusCode).toBe(400);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.send).toHaveBeenCalled();
    });
});