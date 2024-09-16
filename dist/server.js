"use strict"; function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _dotenv = require('dotenv'); var _dotenv2 = _interopRequireDefault(_dotenv);
var _app = require('./app'); var _app2 = _interopRequireDefault(_app);
var _https = require('https'); var _https2 = _interopRequireDefault(_https);
var _path = require('path'); var _path2 = _interopRequireDefault(_path);
var _fs = require('fs'); var _fs2 = _interopRequireDefault(_fs);

_dotenv2.default.config();

const httpsOptions = {
    cert: _fs2.default.readFileSync("/etc/letsencrypt/live/apimk.wiptelecomunicacoes.com.br/fullchain.pem"), // Certificado fullchain do dominio
    key: _fs2.default.readFileSync("/etc/letsencrypt/live/apimk.wiptelecomunicacoes.com.br/privkey.pem"), // Chave privada do domínio
    ca: _fs2.default.readFileSync(_path2.default.resolve(__dirname, 'certificate-chain-prod.crt')), // Certificado público da Efí
    minVersion: "TLSv1.2",
    requestCert: true,
    rejectUnauthorized: false, // Caso precise que os demais endpoints não rejeitem requisições sem mTLS, você pode alterar para false
};

const httpsServer = _https2.default.createServer(httpsOptions, _app2.default);

httpsServer.keepAliveTimeout = 700000;


httpsServer.listen(process.env.PORT, () => {
    console.log("PORTA RODANDO NA " + process.env.PORT);
});


// // src/server.ts
// import http from 'http';
// import app from './app';

// // Crie o servidor HTTP
// const server = http.createServer(app);

// // Inicie o servidor
// server.listen(3000, () => {
//     console.log('Servidor rodando na porta 3000');
// });
