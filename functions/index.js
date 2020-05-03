const functions = require("firebase-functions");
const admin = require("firebase-admin");
const app = require("express")();

admin.initializeApp();

const config = {
  apiKey: "AIzaSyA9QN2KLd2Dh9HaVGCvV5URt08hLSxssBQ",
  authDomain: "it-app-cpm.firebaseapp.com",
  databaseURL: "https://it-app-cpm.firebaseio.com",
  projectId: "it-app-cpm",
  storageBucket: "it-app-cpm.appspot.com",
  messagingSenderId: "618722655546",
  appId: "1:618722655546:web:e0e77028c7482a5fc36403",
  measurementId: "G-ZCR718NH7R"
};

const firebase = require('firebase');
firebase.initializeApp(config);

app.get("/helloWorld", (req, res) => {
  res.send("Hello from Speech2Text project!");
});

exports.api = functions.https.onRequest(app);

exports.createAudioLabels = functions.firestore
  .document("samples/{sampleid}")
  .onCreate(async (snap, context) => {
    const newDoc = snap.data();
    const file_path = newDoc.sample_path;
    const doc_id = snap.id;
    const speech = require("@google-cloud/speech");
    const client = new speech.SpeechClient();

    var setWithOptions;

    const audio = {
      uri: file_path,
    };
    const config = {
      encoding: "LINEAR16",
      sampleRateHertz: 24000,
      languageCode: "en-US",
    };
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcritpion = response.results
      .map((result) => result.alternatives[0].transcript)
      .join("\n");

    var db = admin.firestore();
    var docRef = db.collection("samples").doc(doc_id);
    setWithOptions = docRef.update({
      sample_content: transcritpion,
    });

    return Promise.all([setWithOptions]);
  });

// Signup
  app.post('/signup', (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle,
    }

// TODO: validate data
    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
      .then( data => {
        return res.status(201).json({ message: `user ${data.user.uid} signed up successfully`});
      })
      .catch( err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      })
  })