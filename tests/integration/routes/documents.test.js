const request = require('supertest');
const { Document } = require('../../../models/document');
const { User } = require('../../../models/user');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('config');

let server;

describe('/api/documents', () => {
    beforeEach(() => { server = require('../../../bin/www'); });
    afterEach(async () => {
        let pathToTestFolder = path.join(process.cwd(), config.get('diskStorage.destination'), 'user');

        await fs.promises.access(pathToTestFolder)
            .then(() => fs.promises.rm(pathToTestFolder, { recursive: true }))
            .catch((err) => { return; });

        await User.deleteMany({});
        await Document.deleteMany({});

        server.close();
    });

    describe('GET /mine', () => {
        let user;
        let token;

        const exec = async () => {
            return await request(server)
                .get('/api/documents/mine')
                .set('x-auth-token', token);
        };

        beforeEach(async () => {
            user = new User({ username: 'user', password: '1234' });
            await user.save();

            token = user.generateAuthToken();
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return authorized user\'s documents', async () => {

            let documents = [
                { filename: '1.json', path: '/uploads/user/1.json', size: 150 },
                { filename: '2.json', path: '/uploads/user/2.json', size: 300 }
            ];
            documents = await Document.insertMany(documents);

            documents.forEach((document) => user.documents.push(document._id));
            user = await user.save();

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(document => document._id == user.documents[0])).toBeTruthy();
            expect(res.body.some(document => document._id == user.documents[1])).toBeTruthy();
            expect(res.body.some(document => document._id == user.documents[2])).toBeFalsy();
        });
    });

    describe('GET /mine/:documentId', () => {
        let user;
        let token;
        let documentId;

        const exec = async () => {
            return await request(server)
                .get(`/api/documents/mine/${documentId}`)
                .set('x-auth-token', token);
        };

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
            documentId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the given documentId is not valid', async () => {
            documentId = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no document with given documentId exists', async () => {
            documentId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if document with given documentId exists but not user\'s own', async () => {
            let document = new Document({
                filename: '1.json',
                path: '/uploads/anotherUser/1.json',
                size: 500
            });
            document = await document.save();

            documentId = document._id;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return document if document with given documentId exists and user\'s own', async () => {
            let document = new Document({
                filename: '1.json',
                path: '/uploads/user/1.json',
                size: 500
            });
            document = await document.save();

            user.documents.push(document._id);
            await user.save();

            documentId = document._id;

            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('filename', '1.json');
            expect(res.body).toHaveProperty('path', '/uploads/user/1.json');
            expect(res.body).toHaveProperty('size', 500);
        });
    });

    describe('POST /mine', () => {
        let user;
        let token;
        let file;

        const exec = async () => {
            return await request(server)
                .post('/api/documents/mine')
                .set('x-auth-token', token)
                .attach('document', file)
                .set('Connection', 'keep-alive');
        }

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            user = await user.save();

            token = user.generateAuthToken();

            file = path.join(process.cwd(), 'tests', 'integration', 'files', 'test.json');
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if no documents attached', async () => {
            file = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if a non-JSON document attached', async () => {
            file = path.join(process.cwd(), 'tests', 'integration', 'files', 'test.png');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        /*it('should call user.leftDiskSpace method once', async () => {
            //jest.mock('../../../routes/documents');
            let documentsRouter = require('../../../routes/documents');

            let error = new Error('An error occured...');

            user.leftDiskSpace = jest.fn().mockRejectedValue(error);
            
            let mockReq = { user: user };
            let mockRes = {};

            documentsRouter.post = jest.fn();
            documentsRouter.post.mockImplementation((path, callback) => {
                if(path === '/mine') {
                    console.warn('called');
                    callback(mockReq, mockRes);
                }
            });

            documentsRouter.post('/mine', async (req, res) => {
                console.log(req, res);
            });

            const res = await exec();

            expect(user.leftDiskSpace).toHaveBeenCalled();
        });*/

        it('should return the created document if user is authorized, has disk space and file is valid', async () => {
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('filename');
            expect(res.body).toHaveProperty('path');
            expect(res.body).toHaveProperty('size');
        });
    });

    describe('PUT /mine/:documentId', () => {
        let user;
        let token;
        let documentId;
        let file;

        let testFilesDirectory = path.join(process.cwd(), 'tests', 'integration', 'files');

        const exec = async () => {
            return await request(server)
                .put(`/api/documents/mine/${documentId}`)
                .set('x-auth-token', token)
                .attach('document', file)
                .set('Connection', 'keep-alive');
        }

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            user = await user.save();

            token = user.generateAuthToken();

            file = path.join(testFilesDirectory, 'test.json');
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 if the given documentId is not valid', async () => {
            documentId = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no document with given documentId exists', async () => {
            documentId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if document with given documentId exists but not user\'s own', async () => {
            let document = new Document({
                filename: '1.json',
                path: '/uploads/anotherUser/1.json',
                size: 500
            });
            document = await document.save();

            documentId = document._id;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 400 if no documents attached', async () => {
            file = undefined;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 if a non-JSON document attached', async () => {
            file = path.join(process.cwd(), 'tests', 'integration', 'files', 'test.png');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return the updated document if user is authorized, has disk space and file is valid', async () => {
            let testUploadsDirectory = path.join(process.cwd(), 'tests', 'integration', 'uploads');
            file = path.join(testFilesDirectory, 'update.json');

            let uploadDate = Date.now();
            let document = new Document({
                filename: `test--${uploadDate}.json`,
                path: `/uploads/user/test--${uploadDate}.json`,
                size: 26,
                uploadDate: uploadDate
            });
            document = await document.save();

            let fileContent = await fs.promises.readFile(path.join(testFilesDirectory, 'test.json'), { encoding: 'utf8' })
            await fs.promises.mkdir(path.join(testUploadsDirectory, 'user'));
            await fs.promises.writeFile(path.join(testUploadsDirectory, 'user', `test--${uploadDate}.json`), fileContent, { encoding: 'utf8' });

            documentId = document._id;

            user.documents.push(documentId);
            user = await user.save();
            
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('filename');
            expect(res.body.filename).toMatch(/update/);
            expect(res.body).toHaveProperty('path');
            expect(res.body.path).toMatch(/update/);
            expect(res.body).toHaveProperty('size');
            expect(res.body.size).toBe(33);
        });
    });

    describe('DELETE /mine/:documentId', () => {
        let user;
        let token;
        let documentId;

        const exec = async () => {
            return await request(server)
                .delete(`/api/documents/mine/${documentId}`)
                .set('x-auth-token', token);
        }

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            user = await user.save();

            token = user.generateAuthToken();
        });

        it('should return 401 if user is not authorized', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 404 if the given documentId is not valid', async () => {
            documentId = '1';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 if no document with given documentId exists', async () => {
            documentId = mongoose.Types.ObjectId().toHexString();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 if document with given documentId exists but not user\'s own', async () => {
            let document = new Document({
                filename: '1.json',
                path: '/uploads/anotherUser/1.json',
                size: 500
            });
            document = await document.save();

            documentId = document._id;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the removed document if the document exists and is user\'s', async () => {
            let document = new Document({
                filename: 'test.json',
                path: '/uploads/user/test.json',
                size: 500
            });
            document = await document.save();

            documentId = document._id;

            user.documents.push(documentId);
            user = await user.save();
            
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('filename', 'test.json');
            expect(res.body).toHaveProperty('path', '/uploads/user/test.json');
            expect(res.body).toHaveProperty('size', 500);
        });
    });
});