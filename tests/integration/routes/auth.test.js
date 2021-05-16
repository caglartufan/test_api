const request = require('supertest');
const bcrypt = require('bcrypt');
const { User } = require('../../../models/user');

let server;

describe('/api/auth', () => {
    beforeEach(() => { server = require('../../../bin/www'); });
    afterEach(async () => {
        server.close();
        await User.deleteMany({});
    });

    describe('POST /', () => {
        let user;
        let username;
        let password;

        const exec = async () => {
            return await request(server)
                .post('/api/auth')
                .send({
                    username: username,
                    password: password
                });
        };

        beforeEach(async () => {
            username = 'user';
            password = '1234';
            user = new User({
                username: username,
                password: password
            });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            await user.save();
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

        it('should return 400 if a user with given username could not found', async () => {
            username = 'user1';

            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.error.message).toEqual('Invalid username or password');
        });

        it('should return 400 if password of found user with given username does not match with given password', async () => {
            password = '12345';

            const res = await exec();

            expect(res.status).toBe(400);
            expect(res.body.error.message).toEqual('Invalid username or password');
        });

        it('should return generated JWT as response', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('jwt');
        });
    });
});