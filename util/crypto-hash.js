// Crytographic security hashing
const crypto = require('crypto');

// Takes inputs, sorts them, stringifys them, creates a unique hash
const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    // Updating the hash by stringing it
    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' '));

    return hash.digest('hex');
};

module.exports = cryptoHash;