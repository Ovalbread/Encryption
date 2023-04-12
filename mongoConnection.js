const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
client.connect((err) => {
  if (err) throw err;
  console.log('Connected successfully to server');
  const db = client.db('myblockchain');
  // insert code here to interact with the database
  client.close();
});
