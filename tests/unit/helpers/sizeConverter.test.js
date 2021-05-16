const { mbToBytes, bytesToMb } = require('../../../helpers/sizeConverter');

describe('sizeConverter.mbToBytes', () => {
    it('should return 0 if input is 0', () => {
        const bytes = mbToBytes(0);
        expect(bytes).toBe(0);
    });

    it('should return the value in bytes', () => {
        const bytes = mbToBytes(1);
        expect(bytes).toBe(Math.pow(2, 20));
    });

    it('should throw error if the parameter is not a number', () => {
        expect(() => { mbToBytes('nan'); }).toThrow();
    });

    it('should throw error if the parameter is negative number', () => {
        expect(() => { mbToBytes(-1); }).toThrow();
    });
});

describe('sizeConverter.bytesToMb', () => {
    it('should return 0 if input is 0', () => {
        const bytes = bytesToMb(0);
        expect(bytes).toBe(0);
    });

    it('should return the value in megabytes', () => {
        const bytes = bytesToMb(Math.pow(2, 20));
        expect(bytes).toBe(1);
    });

    it('should throw error if the parameter is not a number', () => {
        expect(() => { bytesToMb('nan'); }).toThrow();
    });

    it('should throw error if the parameter is negative number', () => {
        expect(() => { bytesToMb(-1); }).toThrow();
    });
});