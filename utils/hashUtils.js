const fs = require("fs");
const crypto = require("crypto");
const { readAddons } = require("./fileUtils");

function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", data => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", err => reject(err));
  });
}

function hashExists(hash) {
  const addons = readAddons();
  return addons.some(a => a.fileHash === hash);
}

module.exports = { calculateFileHash, hashExists };
