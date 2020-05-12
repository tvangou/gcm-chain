const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        });
    });

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction);

            expect(transactionPool.transactionMap[transaction.id])
                .toBe(transaction);
        });
    });

    // Transaction updates in API
    describe('existingTransaction()', () => {
        it('returns an existing transaction given an input address', () => {
            transactionPool.setTransaction(transaction);
            
            expect(
                transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })
            ).toBe(transaction);
        });
    });

    // Validate transactions in the transaction pool to be valid or invalid, based on criteria
    // Grabbing valid transactions from the transaction pool
    describe('validTransactions()', () => {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for (let i=0; i<10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'gcm-recipient',
                    amount: 30
                });

                if(i%3===0) {
                    transaction.input.amount = 900099;
                } else if (i%3===1) {
                    transaction.input.signature =  new Wallet().sign('gcm');
                } else {
                    validTransactions.push(transaction);
                }

                transactionPool.setTransaction(transaction);
            }
        });

        // Test to validate a transaction based on criteria above
        it('returns valid transaction', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });

        // Returns error for valid transactions
        it('logs errors for the inalid transactions', () => {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        });
    });

    // Validate that transaction pool is cleared
    // Clearing blockchain transactions so only unique transactions can be recorded
    describe('clear()', () => {
        it('clears the transactions', () => {
            transactionPool.clear();

            expect(transactionPool.transactionMap).toEqual({});
        });
    });

    // Only if it's a valid and accepted blockchain
    describe('clearBlockchainTransactions()', () => {
        it('clears the pool of any existing blockchain transactions', () => {
            const blockchain = new Blockchain();
            const expectedTransactionMap = {};

            for (let i=0; i<6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'gcm', amount: 20
                });

                transactionPool.setTransaction(transaction);

                if (i%2===0) {
                    blockchain.addBlock({ data: [transaction] })
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }

            transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
            
            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});