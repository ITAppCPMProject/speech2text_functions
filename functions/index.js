const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

express = require("express");
const app = express();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

app.get("/helloWorld", (req, res) => {
  res.send("Hello from Speech2Text project!");
});

exports.api = functions.https.onRequest(app);
