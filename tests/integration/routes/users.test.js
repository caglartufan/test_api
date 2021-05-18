const request = require('supertest');
const { User } = require('../../../models/user');
const config = require('config');

let server;

describe('/api/users', () => {
    beforeEach(() => { server = require('../../../bin/www'); });
    afterEach(async () => {
        server.close();
        await User.deleteMany({});
    });

    describe('GET /me', () => {
        let user;
        let token;

        const exec = async () => {
            return await request(server)
                .get('/api/users/me')
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            await user.save();

            token = user.generateAuthToken();
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return the authorized user data except it\'s password', async () => {
            const res = await exec();
    
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('username', user.username);
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('plan', 'free');
            expect(res.body).toHaveProperty('documents', []);
            expect(res.body).toHaveProperty('joinDate');
        });
    });

    describe('GET /me/left-disk-space', () => {
        let user;
        let token;
        let query;
        const plans = config.get('plans');

        const exec = async () => {
            return await request(server)
                .get(`/api/users/me/left-disk-space${query}`)
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234',
            });
            await user.save();

            token = user.generateAuthToken();
            query = '';
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return authorized user\'s left disk space in bytes and megabytes', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('leftDiskSpaceInBytes');
            expect(res.body).toHaveProperty('leftDiskSpaceInMbs');
        });

        it('should return authorized user\'s left disk space in megabytes without rounding if round=false query parameter is set', async () => {
            query = '?round=false';
            
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('leftDiskSpaceInBytes');
            expect(res.body).toHaveProperty('leftDiskSpaceInMbs');
        });

        it(`should return ${plans.free.diskSpace}MB left disk space if the authorized user is using free plan`, async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('leftDiskSpaceInBytes', plans.free.diskSpace*Math.pow(2, 20));
            expect(res.body).toHaveProperty('leftDiskSpaceInMbs', plans.free.diskSpace);
        });

        it(`should return ${plans.premium.diskSpace}MB left disk space if the authorized user is using premium plan`, async () => {
            user.plan = 'premium';
            await user.save();

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('leftDiskSpaceInBytes', plans.premium.diskSpace*Math.pow(2, 20));
            expect(res.body).toHaveProperty('leftDiskSpaceInMbs', plans.premium.diskSpace);
        });
    });

    describe('PUT /me', () => {
        let user;
        let token;
        let newPassword;

        const exec = async () => {
            return await request(server)
                .put('/api/users/me')
                .set('x-auth-token', token)
                .send({ password: newPassword });
        };

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            await user.save();

            token = user.generateAuthToken();
            newPassword = '12345';
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if new password is undefined', async () => {
            newPassword = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if new password is less than 4 characters', async () => {
            newPassword = '123';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if new password is more than 255 characters', async () => {
            newPassword = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return the updated user if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.headers).toHaveProperty('x-auth-token');
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('username', user.username);
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('plan', 'free');
            expect(res.body).toHaveProperty('documents', []);
            expect(res.body).toHaveProperty('joinDate');
        });
    });

    describe('POST /', () => {
        let username;
        let password;

        const exec = async () => {
            return await request(server)
                .post('/api/users')
                .send({
                    username: username,
                    password: password
                });
        };

        beforeEach(() => {
            username = 'user';
            password = '1234';
        });

        it('should return 400 if both username and password are undefined', async () => {
            username = undefined;
            password = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if username is undefined', async () => {
            username = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if password is undefined', async () => {
            password = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if username is less than 3 characters', async () => {
            username = 'us';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if username is more than 30 characters', async () => {
            username = new Array(32).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if password is less than 4 characters', async () => {
            password = '123';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if password is more than 255 characters', async () => {
            password = new Array(257).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if given username is already in use', async () => {
            await User.collection.insertOne({ username: 'user' });

            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.error.message).toEqual('Girmiş olduğunuz kullanıcı adı kullanımda.');
        });

        it('should return the created user if it is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.headers).toHaveProperty('x-auth-token');
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('username', username);
            expect(res.body).not.toHaveProperty('password');
            expect(res.body).toHaveProperty('plan', 'free');
            expect(res.body).toHaveProperty('documents', []);
            expect(res.body).toHaveProperty('joinDate');
        });
    });
});