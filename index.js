const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const isDevelopment = process.env.ENV === 'development';

const REDIS_URL = isDevelopment ?
    'redis://127.0.0.1:6379' :
    'redis://h:pda005a70e5f8df1afae3297df0de6b4440637d8221806cef411d2fcd8289585e@ec2-3-218-87-227.compute-1.amazonaws.com:18069'
// Root node address
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = isDevelopment ?
    `http://localhost:${DEFAULT_PORT}` :
    'https://thawing-sierra-19459.herokuapp.com';

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

app.use(bodyParser.json());
// Serves up the Java
// Serves up the frontend page using the existing express server
app.use(express.static(path.join(__dirname, 'client/dist')));

// Define a GET request // Getting the blocks
app.get('/api/blocks', (req, res) => {
    // RES - how we want the GET request to respond
    res.json(blockchain.chain);
});

// Block pagination
app.get('/api/blocks/length', (req, res) => {
    res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;

    const blocksReversed = blockchain.chain.slice().reverse();

    let startIndex = (id-1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;

    res.json(blocksReversed.slice(startIndex, endIndex));
});

// Define a POST request // Mining the blocks
app.post('/api/mine', (req, res) => {
    // REQ - The info we want to post
    const { data } = req.body;

    blockchain.addBlock({ data });

    pubsub.broadcastChain();

    // Confirmation of posting the block
    res.redirect('/api/blocks');
});

// API Post request for requester to conduct a transaction using the wallet
// Specifying recipient and amount in its body
app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;

    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });

    // Error response
    try {
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ 
                recipient,
                amount,
                chain: blockchain.chain 
            });
        }
    } catch(error) {
        return res.status(400).json({ type: 'error', message: error.message });
    }

    transactionPool.setTransaction(transaction);

    // So that transactions can by in sync across all peers
    pubsub.broadcastTransaction(transaction);

    res.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});

// Getting Mined transactions
// Adding a transactions endpoint to enable transaction mining through the API
app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();

    res.redirect('/api/blocks');
});

// Exposing the wallet information (publicKey & balance) through the API
app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;

    res.json({ 
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
    });
});

// List of known addresses
app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};

    for (let block of blockchain.chain) {
        for (let transaction of block.data) {
            const recipient = Object.keys(transaction.outputMap);

            recipient.forEach(recipient => addressMap[recipient] = recipient);
        }
    }

    res.json(Object.keys(addressMap));
    
});

// List of known addresses
app.get('/api/known-balances', (req, res) => {
    const addresses = addressMap;

    res.json({ 
        addresses,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, addresses })
    });
});


// A GET to serve-up the front-end 
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

//Sync up chains -- 2 criteria: 1. not an error, 2. HTTP status code of 200
const synchWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if(!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);

            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
};

if (isDevelopment) {
    // CREATING NEW Wallets
    const walletTRE = new Wallet();
    const walletGPS = new Wallet();

    // Syncing wallet transactions into the transaction pool
    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        const transaction = wallet.createTransaction({
            recipient, amount, chain: blockchain.chain
        });

        transactionPool.setTransaction(transaction);
    };

    // Defining the wallet transactions
    const walletAction = () => generateWalletTransaction({
        wallet, recipient: walletTRE.publicKey, amount: 5
    });

    const walletTREAction = () => generateWalletTransaction({
        wallet: walletTRE, recipient: walletGPS.publicKey, amount: 10
    });

    const walletGPSAction = () => generateWalletTransaction({
        wallet: walletGPS, recipient: wallet.publicKey, amount: 15
    });

    for (let i=0; i<20; i++) {
        if(i%3 === 0) {
            walletAction();
            walletTREAction();
        } else if(i%3 === 1) {
            walletAction;
            walletGPSAction();
        } else {
            walletTREAction();
            walletGPSAction();
        }

        // Mine all the transactions from the pool to the blockchain
        transactionMiner.mineTransactions();
    }
}

// Distinguish a default port from a peer port - calling on create-env in package.json
// Allowing peers to talk/ multiple instances of the blockchain
let PEER_PORT;

// Creating a peer port, anywhere from 3000 to 4000
if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}

// Creating the API Port, Sync up the chain to api/block endpoint
const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);

    if (PORT !== DEFAULT_PORT) {
        synchWithRootState();
    }
});