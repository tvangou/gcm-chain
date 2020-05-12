// Official records of exchange of currency between two wallets
const uuid = require('uuid');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Transaction {
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid.v4();
        this.outputMap = outputMap || this.createOutputMap({ senderWallet, recipient, amount });
        this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    // Output Map: updates the wallet after a transaction. With current balance
    // Any values conducted in the transaction
    createOutputMap({ senderWallet, recipient, amount }) {
        const outputMap = {};

        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    // An object with an amount, address, and signature attached to wallet's public key
    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    // Updating the transaction
    update({ senderWallet, recipient, amount }) {
        if(amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }
        
        // Checking if the recipient already exists in the output map
        if(!this.outputMap[recipient]) {
            this.outputMap[recipient] = amount;
        } else {
            this.outputMap[recipient] = this.outputMap[recipient] + amount;
        }

        this.outputMap[senderWallet.publicKey] = 
            this.outputMap[senderWallet.publicKey] - amount;

        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    // Validating that Output map value matches transaction amount
    static validTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;

        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);

        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }

        if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }

        return true;
    }

    static rewardTransaction({ minerWallet }) {
        return new this({
            input: REWARD_INPUT,
            outputMap: {[minerWallet.publicKey]: MINING_REWARD }
        });
    }
}

module.exports = Transaction;