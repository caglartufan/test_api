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
        server.close();
        let pathToTestFolder = path.join(process.cwd(), config.get('diskStorage.destination'), 'user');
        let error = await fs.promises.access(pathToTestFolder);
        if(!error) await fs.promises.unlink(pathToTestFolder);
        //await fs.promises.rmdir();
        await User.deleteMany({});
        await Document.deleteMany({});
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
                .attach('document', file);
        }

        beforeEach(async () => {
            user = new User({
                username: 'user',
                password: '1234'
            });
            user = await user.save();

            user.leftDiskSpace(function(err, size) { console.log(size); });

            token = user.generateAuthToken();

            file = path.join(process.cwd(), 'tests', 'integration', 'files', 'test.json');
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

        it('should return 400 if an error occurs during calculation of authorized user\'s left disk space', async () => {
            //jest.mock('../../../models/user');
            //let user = require('../../../models/user');

            let error = new Error('Something went wrong...');

            user.leftDiskSpace.mockImplementation(callback => callback(error, null));

            const res = await exec();

            console.log(res.body);

            expect(res.status).toBe(400);
            expect(res.body.error).toHaveProperty('message', 'Something went wrong...');
        });

        it('should return the created document if user is authorized, has disk space and file is valid', async () => {
            let anotherDocument = new Document({
                filename: 'test--1621201388154',
                path: path.join(process.cwd(), config.get('diskStorage.destination'), 'user'),
                size: 500
            });
            await anotherDocument.save();

            user.documents.push(anotherDocument);
            await user.save();
            
            const res = await exec();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('filename');
            expect(res.body).toHaveProperty('path');
            expect(res.body).toHaveProperty('size');
        });
    });
});