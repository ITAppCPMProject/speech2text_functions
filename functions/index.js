const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

express = require("express");
const app = express();

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
