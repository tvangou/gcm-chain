// Building block of blockchain
const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../util');

// The structure of a block
// Difficulty and nonce fields were created for the 'proof of work system'
class Block {
     constructor({timestamp, lastHash, hash, data, nonce, difficulty }) {
         this.timestamp = timestamp;
         this.lastHash = lastHash;
         this.hash = hash;
         this.data = data;
         this.nonce = nonce;
         this.difficulty = difficulty;
     }

     // Initial genesis block
     static genesis() {
         return new this(GENESIS_DATA);
     }
     // Mine Block, dynamic fields denoted by 'let'
     // Blocks are added
     static mineBlock({ lastBlock, data }) {
        const lastHash = lastBlock.hash;
        let hash, timestamp;
        let { difficulty } = lastBlock;
        let nonce = 0;

        // Updating the nonce each iteration, while finding a hash that matches the difficulty //
        // Proof of work system in action
        // Valid hash meeting difficulty requirement: certain leading 0 bits. Difficulty adjusts
        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        } while (hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));

         return new this({ timestamp,lastHash,data,difficulty,nonce,hash });
     }

     // Adjusting the difficulty of the hash - averaging the rate blocks are mined in the system
     // Brings us to an average set mined rate
     // Avoids the 51% attack
     static adjustDifficulty({ originalBlock, timestamp }) {
         const { difficulty } = originalBlock;

         if (difficulty < 1) return 1;

         if ((timestamp - originalBlock.timestamp) > MINE_RATE ) return difficulty - 1;

         return difficulty + 1;
     }
}

module.exports = Block;
