const cryptoHash = require('./crypto-hash');

describe ('cryptoHash()', () => {
    
    it('generates a SHA-256 hashed output', () => {
        expect(cryptoHash('gcm'))
            .toEqual('5966093417526b18cfcf8feb40ca913e229c55d78ee64985602ceaa47faa082c');
    });

    it('produces the same hash with the same input arguments in any order', () => {
        expect(cryptoHash('one', 'two', 'three'))
            .toEqual(cryptoHash('three', 'one', 'two'));
    });

    it('produces a unique hash when the properties have changed on an input', () => {
        const gcm = {};
        const originalHash = cryptoHash(gcm);
        gcm['a']= 'a';

        expect(cryptoHash(gcm)).not.toEqual(originalHash);
    });
});