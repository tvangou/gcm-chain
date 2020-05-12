// Class for how messages are PUBBED and SUBBED on the network/server
const redis = require('redis');

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

//Every PUB SUB has a local blockchain to it (calling the blockchain in the constructor)
// New channels can be added
class PubSub {
    constructor({ blockchain, transactionPool, redisUrl })  {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;

        // The publisher
        this.publisher = redis.createClient(redisUrl);
        // The subscriber
        this.subscriber = redis.createClient(redisUrl);

        // Calling the channels
        this.subscribeToChannels();

        // Message
        this.subscriber.on(
            'message',
            (channel, message) => this.handleMessage(channel, message)
        );
    }

    // Handling the message
    handleMessage(channel, message) {
        console.log(`Message received. Channel: ${channel}. Message: ${message}.`);

        const parsedMessage = JSON.parse(message);

        // Channel statements. Transaction data is validated as true
        switch(channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessage
                    });
                });
                break;
            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage);
                break;
            default:
                return;
        }
    }

    // Calling all the available channels
    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel);
        });
    }
    // Publishing a message over a designated channel. Subscriber not sending msg to itself (unsub, send, sub)
    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }

    // Broadcast the blockchain over the channel
    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            // Convery array to string - Can only publish a string on network; blockchain is an array
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    // Broadcase the transaction over the channel
    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        })
    }
}

module.exports = PubSub;