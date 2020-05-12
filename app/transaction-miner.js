// Class describing how miners should add transactions to the block
const Transaction = require('../wallet/transaction');

class TransactionMiner {
    constructor({ blockchain, transactionPool, wallet, pubsub }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    // How miners should get transactions from the pool
    mineTransactions() {
        // Get the transaction pool's valid transaction
        const validTransactions = this.transactionPool.validTransactions();

        // Generate the miner's reward
        validTransactions.push(
        Transaction.rewardTransaction({ minerWallet: this.wallet })
        );

        // Add a block consisting of these transactions to the blockchain
        this.blockchain.addBlock({ data: validTransactions });

        // Broadcast the updated blockchain
        this.pubsub.broadcastChain();

        // Clear the transaction pool
        this.transactionPool.clear();
    }
}

module.exports = TransactionMiner;