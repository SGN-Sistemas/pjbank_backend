const chaves = require('../../chaves.json');
require('dotenv/config');

// const sqlConfig = {

//   user: process.env.DB_USER,
//   password: process.env.DB_PWD,
//   database: process.env.DB_NAME,
//   server: process.env.DB_SERVER,
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000
//   },
//   options: {
//     encrypt: false, // for azure
//     trustServerCertificate: false // change to true for local dev / self-signed certs
//   }
// }

// console.log(sqlConfig)

// module.exports = {sqlConfig};

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