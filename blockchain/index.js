const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

// The Blockchain: Connecting multiple blocks into an array
class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }
    
    // Passing the last block reference: lastHash must be Hash of previous block
    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length-1],
            data
        });

        this.chain.push(newBlock);
    }

    // If the incoming chain is valid and is longer, the chain is replaced by the incoming chain
    // Nodes along the blockchain are agreeing on the longest version of the blockchain, assuming validity
    // Adding a validate Transactions flag
    replaceChain(chain, validateTransactions, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error('The incoming chain must be longer');
            return;
        }

        if(!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain must be valid');
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid data');
            return ;
        }

        // Clearing recorded transactions on a successful replacement of the blockchain
        if (onSuccess) onSuccess();
        console.log('replacing chain with', chain);
        this.chain = chain;
    }

    // Validating transaction data incoming into the blockchain, begining with reward counting
    // Preventing duplicate transactions from appearing in blocks data (Set)
    // Rules of the cryptocurrency: 
    //          1. No mutiple rewards, 2. Valid chain for the transaction 3. Input balances are valid
    //          4. No duplicates of transactions in the block
    validTransactionData({ chain }) {
        for (let i=1; i<chain.length; i++) {
            const block = chain[i];
            // A java script class that prohibits duplicates
            const transactionSet = new Set();
            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount +=1;

                    if (rewardTransactionCount >1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    // this grabs the first value in output map
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }

                    // Validating incoming transaction input balances
                    // Verifying the input: making sure an input can't be faked
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    // Input matches true balance
                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    // Preventing duplicate transactions in block's data
                    // Only 1 transaction can be added to the transaction Set
                    if (transactionSet.has(transaction)) {
                        console.error('An identical transaction appears more than once in the block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    }

    // Chain validation
    static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
        return false
    };

    // LastHash of each block must be valid
    // Difficulty requirement for each generated hash based on difficulty
    for (let i=1; i<chain.length; i++) {
        const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
        const actualLastHash = chain[i-1].hash;
        const lastDifficulty = chain[i-1].difficulty;

        if(lastHash !== actualLastHash) return false;

        // All fields must be validated by the validated hash
        // AKA no one can break the hash linking
        const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);

        if (hash !== validatedHash) return false;

        if (Math.abs(lastDifficulty - difficulty) > 1) return false;
    }

        return true;
    }
}

module.exports = Blockchain;