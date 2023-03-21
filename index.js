require('express-async-errors');
require('dotenv/config');
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
const app = express();

app.use(cors('*'));
app.use(bodyParser.json());

app.use('/', require('./src/route/boletoRoute'));
app.use('/', require('./src/route/contaDigitalRoute'));
app.use('/', require('./src/route/webHookRouter'));
app.use('/', require('./src/route/pixRoute'));
app.use('/', require('./src/route/contaRecebimento'));
app.use('/', require('./src/route/boletoSemContaDigitalRoute.js'));

app.get('/', (req, res) => {
     res.status(200).json({status: "Funcionando!"});
});

app.get('/conexao', (req, res) => {

     let servidor = req.query.ip;
     let usuario  = req.query.user;
     let senha    = req.query.pass;
     let banco    = req.query.banco;

     process.env.DB_SERVER = servidor;
     process.env.DB_USER   = usuario;
     process.env.DB_PWD    = senha;
     process.env.DB_NAME   = banco;

     console.log('Servidor: ');
     console.log(process.env.DB_SERVER);
     console.log('Usuário: ');
     console.log(process.env.DB_USER)
     console.log('Senha: ');
     console.log(process.env.DB_PWD);
     console.log('Banco: ');
     console.log(process.env.DB_NAME);

     let obj_conexao = {
          
          server_conf: {
               server: process.env.DB_SERVER,
               usuario: process.env.DB_USER,
               senha: process.env.DB_PWD,
               banco: process.env.DB_NAME,
               status: "Conexão configurada com sucesso!"
          }
     }

     res.status(200).json(obj_conexao);

});
 
app.use((error, req, res, next) => {

     res.status(500).json({status: 500, message: error.message});
});

app.listen(9000, () => {
     console.log(process.env.PRE_URL_PJBANK);
     console.log("Servidor rodando na porta 9000...");
})
