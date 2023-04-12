// Define schema for blockchain data
const mongoose = require('mongoose');
const BlockchainSchema = new mongoose.Schema({
    index: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    data: {
      type: Object,
      required: true
    },
    previousHash: {
      type: String,
      required: true
    },
    hash: {
      type: String,
      required: true
    },
    nonce: {
      type: Number,
      required: true
    },
  });
  // Create model for blockchain data
  const BlockchainModel = mongoose.model('Blockchain', BlockchainSchema);
  module.exports = BlockchainModel