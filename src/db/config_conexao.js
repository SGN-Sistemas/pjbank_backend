const chaves = require('../../chaves.json');

const sqlConfig = {
    user: chaves.banco_dados.usuario,
    password: chaves.banco_dados.senha,
    database: chaves.banco_dados.banco,
    server: chaves.banco_dados.servidor,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: false, // for azure
      trustServerCertificate: false // change to true for local dev / self-signed certs
    }
  }

  module.exports = {sqlConfig};