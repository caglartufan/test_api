const createError = require('../../../helpers/createError');

describe('createError', () => {
    it('should return a valid object', () => {
        const error = createError('a', 1);

        expect(error).toEqual({ error: { message: 'a', statusCode: 1 }});
    });

    it('should return an object without status code property if not specified', () => {
        const error = createError('a');

        expect(error).toEqual({ error: { message : 'a' } });
    });

    it('should return an object with empty error property if both message and status code are not specified', () => {
        const error = createError();

        expect(error).toEqual({ error: {} });
    });
});