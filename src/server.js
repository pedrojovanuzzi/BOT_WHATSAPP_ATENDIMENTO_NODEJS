import dotenv from 'dotenv';
import app from './app';
import https from 'https';
import path from 'path';
import fs from 'fs';

dotenv.config();

const httpsOptions = {
    cert: fs.readFileSync("/etc/letsencrypt/live/apimk.wiptelecomunicacoes.com.br/fullchain.pem"), // Certificado fullchain do dominio
    key: fs.readFileSync("/etc/letsencrypt/live/apimk.wiptelecomunicacoes.com.br/privkey.pem"), // Chave privada do domínio
    ca: fs.readFileSync(path.resolve(__dirname, 'certificate-chain-prod.crt')), // Certificado público da Efí
    minVersion: "TLSv1.2",
    requestCert: true,
    rejectUnauthorized: false, // Caso precise que os demais endpoints não rejeitem requisições sem mTLS, você pode alterar para false
};

const httpsServer = https.createServer(httpsOptions, app);

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
