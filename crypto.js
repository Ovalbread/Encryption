const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const MongoClient = require('mongodb').MongoClient;
const dbConnection = require('./mongoConnection')
const BlockchainModel = require('./blockchainModel');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }
  calculateHash() {
    return crypto.createHash('sha512').update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).digest('hex');
  }
  mineBlock(difficulty) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
  }
  createGenesisBlock() {
    return new Block(0, new Date().toString(), 'Genesis block', '0');
  }
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

// Usage
const blockchain = new Blockchain();

const rsa = new NodeRSA({ b: 512 });
const privateKey = rsa.exportKey('private');
const publicKey = rsa.exportKey('public');

const encryptRsa = new NodeRSA();
encryptRsa.importKey(publicKey);

const encryptedText = encryptRsa.encrypt(JSON.stringify({ text: 'hello world' }), 'base64');

console.log(encryptedText);

async function getDataFromDatabase() {
  const client = await MongoClient.connect("mongodb://127.0.0.1:27017");
  const database = client.db('dbblock');
  const collection = database.collection('student');
  const cursor = collection.find({});
  const documents = await cursor.toArray();
  await client.close();
  return documents;
}
async function addDataToBlockchain() {
  const data = await getDataFromDatabase();

  const blockchain = new Blockchain();

  // Iterate over the documents in the data array and add each one to the blockchain
  for (let i = 0; i < data.length; i++) {
    const { timestamp, transcripts } = data[i];
    const decryptedTranscripts = rsa.decrypt(transcripts, 'utf8');
    blockchain.addBlock(new Block(i + 1, timestamp, { transcripts: decryptedTranscripts }));
  }

  console.log(JSON.stringify(blockchain, null, 2));
  console.log(`Is blockchain valid? ${blockchain.isChainValid()}`);

  // Save the blockchain data to a new collection using Mongoose
  const blockchainData = blockchain.chain.map(block => ({
    index: block.index,
    timestamp: block.timestamp,
    data: block.data,
    previousHash: block.previousHash,
    hash: block.hash,
    nonce: block.nonce
  }));
  await BlockchainModel.create(blockchainData);
}
