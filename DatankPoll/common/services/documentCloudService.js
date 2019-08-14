'use strict';
const Storage = require('@google-cloud/storage');
const Boom = require('loopback-boom');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const keyFilename = path.join('local-dev.json');
const fileKey = fs.readFileSync(`${process.cwd()}/local-dev.json`); // eslint-disable-line
const keyJSON = JSON.parse(fileKey);

const {BUCKET_NAME, PROJECT_ID} = process.env;
const bucketName = 'datank-exam';
const projectId = 'autogenaaccesorios';
const storageLink = `https://storage.googleapis.com/${bucketName}`;

async function checkSize(files) {
  for (const file of files) {
    let extName = path.extname(file.path);
    fs.stat(file.path, (e, stats) => {
      if (e) throw Boom.internal(e);
      if (extName === '.pdf' || extName === '.jpg' || extName === '.jpeg' || extName === '.png') { // eslint-disable-line
        if (stats.size / 500000.0 > 10) throw Boom.notAcceptable(`El archivo ${file.fieldname} no debe ser mayor a 5Mb.`); // eslint-disable-line
      }
    });
  }
}

async function uploadDocument(filePath) {
  const storage = new Storage({projectId});
  try {
    const x = await storage.bucket(bucketName).upload(filePath);
    return x;
  } catch (e) {
    throw e;
  }
}

async function deleteDocument(fileName) {
  const storage = new Storage({projectId});
  try {
    await storage.bucket(bucketName).file(fileName).delete();
  } catch (e) {
    throw e;
  }
}

module.exports = {
  uploadDocument,
  deleteDocument,
  checkSize,
  storageLink,
  signUrlDocument
};
