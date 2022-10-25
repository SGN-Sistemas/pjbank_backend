const chaves = require('../../chaves.json');

const smtp = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: "sac@sgnsistemas.com.br",
        pass: chaves.senha_email
    },
    tls: { rejectUnauthorized: false }
};

module.exports = {smtp};