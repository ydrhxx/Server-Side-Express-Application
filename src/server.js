const https = require('https');
const fs = require('fs');
const app = require('./app');

const PORT = process.env.PORT || 3000;

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});
