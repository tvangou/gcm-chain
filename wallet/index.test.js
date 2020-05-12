const Wallet = require('./index');
const Transaction = require('./transaction');
const { verifySignature } = require('../util');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
    let wallet;

    // Wallet tests
    beforeEach(() => {
        wallet = new Wallet();
    });

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'GCM';

        // Verifying the wallet has a signature based on public key, data and signature
        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('does not verify an invalid signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });

    //Create the transaction from the wallet
    describe('createTransaction()', () => {
        describe('and the amount exceeds the balanace', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({ amount: 999999, recipient: 'gcm-recipient' }))
                .toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is valid', () => {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'gcm-recipient';
                transaction = wallet.createTransaction({ amount, recipient });
            });

            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            //Public key matches transaction/wallet address
            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });

        // When a chain is passed, the wallet balance is calculated
        describe('and a chain is passed', () => {
            it('calls `Wallet.calculateBalance`', () => {
                const calculateBalanceMock = jest.fn();

                const originalCalculateBalance = Wallet.calculateBalance;

                Wallet.calculateBalance = calculateBalanceMock;

                wallet.createTransaction({
                    recipient: 'foo',
                    amount: 10,
                    chain: new Blockchain().chain
                });

                expect(calculateBalanceMock).toHaveBeenCalled();

                Wallet.calculateBalance = originalCalculateBalance;
            });
        });
    });

    // Calculate the wallet balance tests
    describe('calculateBalance()', () => {
        let blockchain;

        beforeEach(() => {
            blockchain = new Blockchain();
        });

        // When a wallet has no outputs (pmt or rct), the balance returns the starting balance
        describe('and there are no outputs for the wallet', () => {
            it('returns the `STARTING_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE);
            });
        });

        // When a wallet has outputs, return the balance as: starting + Σ(outputs)
        describe('and there are outputs for the wallet', () => {
            let transactionOne, transactionTwo;

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                });

                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 60
                });

                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });

            // Sum of outputs test
            it('adds the sum of all outputs to the wallet balance', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE +
                    transactionOne.outputMap[wallet.publicKey] +
                    transactionTwo.outputMap[wallet.publicKey]
                );
            });

            // Test where wallet balance only update based on most recent transaction
            describe('and the wallet has made a transaction', () => {
                let recentTransaction;

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'gcm',
                        amount: 30
                    });

                    blockchain.addBlock({ data: [recentTransaction] });
                });

                // balance + most recent transaction
                it('returns the output amount of the recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                });

                describe('and there are outputs next to and after the most recent transaction', () => {
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            recipient: 'gcm-1',
                            amount: 60
                        });

                        sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

                        blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey, amount: 75
                        });

                        blockchain.addBlock({ data: [nextBlockTransaction] });
                    });

                    // New transactions include all outputs (mined and any other outputs)
                    it('includes the output amounts in the returned balance', () => {
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        ).toEqual(
                            recentTransaction.outputMap[wallet.publicKey] + 
                            sameBlockTransaction.outputMap[wallet.publicKey] + 
                            nextBlockTransaction.outputMap[wallet.publicKey]
                        );
                    });
                });
            });
        });
    });
});