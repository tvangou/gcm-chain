// Allow multiple users to interact in the cryptocurrency
// All important job: holding the key pair: public and private
// Public key is the address, Private key is secret - together creates the unique signature
const Transaction = require('./transaction');
const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');

// The Wallet 
class Wallet {
    constructor() {
        this.balance = STARTING_BALANCE;

        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data))
    }

    // Applying the calculated wallet balanced whenever conducting a new transaction
    createTransaction({ recipient, amount, chain }) {
        if (chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }

        if (amount > this.balance) {
            throw new Error('Amount exceeds balance');
        }

        return new Transaction({ senderWallet: this, recipient, amount });
    }

    // Calculating wallet balance based on blockchain history. Output amount at its most recent transaction
    // Calculating outputs total, startingat last block, skipping genesis block [i=1]
    // Last block and stops at first instance of transaction. begins the calculation from there.
    static calculateBalance({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        for (let i=chain.length-1; i>0; i--) {
            const block = chain[i];

            for (let transaction of block.data) {
                if (transaction.input.address === address) {
                    hasConductedTransaction = true;
                }

                const addressOutput = transaction.outputMap[address];

                if (addressOutput) {
                    outputsTotal = outputsTotal + addressOutput;
                }
            }

            // Stops loop if transaction was conducted
            if(hasConductedTransaction) {
                break;
            }
        }

        // No transaction: starting balance + output
        // previous transaction: wallet balance + recent transaction (aka outputs Total)
        return hasConductedTransaction ? outputsTotal : STARTING_BALANCE + outputsTotal;
    }
};

module.exports = Wallet;