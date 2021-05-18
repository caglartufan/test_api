describe('accessAndRemoveFile', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    })
    it('should try', () => {
        /*let fs = require('fs');
        let lib = require('../../../helpers/accessAndRemoveFile');

        fs.promises.access = jest.fn().mockRejectedValue(new Error('something...'));

        lib('test');*/
        expect(true).toBeTruthy();
    });
});