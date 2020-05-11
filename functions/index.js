const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const os = require("os");
const Busboy = require("busboy");

const speech = require("@google-cloud/speech");
const client = new speech.SpeechClient();

app.get("/helloWorld", (req, res) => {
  res.send("Hello from Speech2Text project!");
});

app.post("/uploadSample", async (req, res) => {
  const busboy = new Busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();
  const fields = {};
  const uploads = {};

  const fileWrites = [];
  busboy.on("file", async (fieldname, file, filename) => {
    console.log(`Processed file ${filename}`);
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = filepath;

    const writeStream = fs.createWriteStream(filepath);
    file.pipe(writeStream);
  });

  busboy.on("finish", async () => {
    await Promise.all(fileWrites);

    for (const file in uploads) {
      fs.unlinkSync(uploads[file]);
    }
  });

  busboy.end(req.rawBody);

  const config = {
    encoding: "LINEAR16",
    sampleRateHertz: 8000,
    languageCode: "en-US",
  };
  const audio = {
    content: req.rawBody.toString("base64"),
  };
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");

  res.send({
    status: true,
    message: "File is uploaded",
    data: {
      transcription: transcription,
    },
  });
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
