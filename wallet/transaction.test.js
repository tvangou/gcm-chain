const Transaction = require('./transaction');
const Wallet = require('./index');
const {verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

// Creating the transaction
describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;

        transaction = new Transaction({ senderWallet,recipient, amount });
    });

    // test if transaction has ID
    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });

    // Output Map - Key for each receiver, value they are receiving
    describe('outputMap', () => {
        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap');
        });

        // To check if output map contains recipient key with the value of this amount
        it('outputs the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        // Amount of balance remaining after transaction is complete
        it('outputs the remaining balance for the `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
            .toEqual(senderWallet.balance - amount);
        });
    });

    // Tests for the transaction inputs (input, timestamp, balance amt, wallet address)
    describe('input', () => {
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(
                verifySignature({
                    publicKey: senderWallet.publicKey,
                    data: transaction.outputMap,
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    // Tests if the transactions are valid
    describe('validTransaction()', () => {
        let errorMock;

        beforeEach(() => {
            errorMock = jest.fn();

            global.console.error = errorMock;
        });
        describe('when the transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });

        // Invalid tests: 1) fraudulent, 2)fake signature
        describe('when the transaction is invalid', () => {
            // Output map has been messed with
            describe('and a transaction outputMap value is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999;

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            // Change the signature to a signature from a new wallet
            describe('and the transaction input signature is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.input.signature = new Wallet().sign('data');

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });

    // Tests for transactions to contain more output values
    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('and the amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'gcm', amount: 999999
                    })
                }).toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 50;
    
                transaction.update({ 
                    senderWallet, recipient: nextRecipient, amount: nextAmount 
                });
            });
    
            it('outputs the amount to the next receipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });
    
            // Remaining balance is accurate
            it('subtracts the amount from the sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey])
                    .toEqual(originalSenderOutput - nextAmount);
            });
    
            // Maintains output = input
            it('maintains a total output that matches the input amount', () => {
                expect(
                    Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total + outputAmount)
                ).toEqual(transaction.input.amount);
            });
    
            // New signature from new transaction
            it('re-signs the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('and another update for the same recipient', () => {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({
                        senderWallet, recipient: nextRecipient, amount: addedAmount
                    });
                });

                it('adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient])
                        .toEqual(nextAmount + addedAmount);
                });

                it('subtracts the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                        .toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });

    // Testing for Mining Reward (Miner receives reward)
    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });

        // Reward transaction is created
        it('creates a transaction with the reward input', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('creates one transaction for the miner with the `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});