const Blockchain = require('../blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({ data: 'initial'});

console.log('first block', blockchain.chain[blockchain.chain.length-1]);

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

for (let i=0; i<10000; i++) {
    // finds previous timestamp
    prevTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;

    // adds a block, finds the next block
    blockchain.addBlock({ data: `block ${i}`});
    nextBlock = blockchain.chain[blockchain.chain.length-1];

    // gets the next timestamp, time diff and times array
    nextTimestamp = nextBlock.timestamp;
    timeDiff = nextTimestamp - prevTimestamp;
    times.push(timeDiff);

    average = times.reduce((total, num) => (total + num))/times.length;

    console.log(`Time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average}ms`);
}