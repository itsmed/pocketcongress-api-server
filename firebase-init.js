var admin = require("firebase-admin");

var serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pocketcongress-aaa65.firebaseio.com"
});

const db = admin.database();

module.exports = { db };
