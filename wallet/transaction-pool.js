// Users start contributing the trasactions - data is collected in the transaction pool
const Transaction = require('./transaction'); 

class TransactionPool {
    constructor() {
        this.transactionMap = {};
    }

    clear() {
        this.transactionMap = {};
    }

    setTransaction(transaction) {
        this.transactionMap[transaction.id] = transaction;
    }

    setMap(transactionMap) {
        this.transactionMap = transactionMap;
    }

    existingTransaction({ inputAddress }) {
        const transactions = Object.values(this.transactionMap);

        return transactions.find(transaction => transaction.input.address === inputAddress);
    }

    // Creating the ability to grab valid transactions from the transaction pool
    validTransactions() {
        return Object.values(this.transactionMap).filter(
            transaction => Transaction.validTransaction(transaction)
        );
    }

    // Start at 1 to skip genesis block
    // Go through each transaction of blocks data. if tMap has id, delete the reference
    clearBlockchainTransactions({ chain }) {
        for(let i=1; i<chain.length; i++) {
            const block = chain[i];

            for (let transaction of block.data) {
                if (this.transactionMap[transaction.id]) {
                    delete this.transactionMap[transaction.id];
                }
            }
        }
    }
}

module.exports = TransactionPool;