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
 
app.use((error, req, res, next) => {

     res.status(500).json({status: 500, message: error.message});
});

app.listen(9000, () => {
     console.log(process.env.PRE_URL_PJBANK);
     console.log("Servidor rodando na porta 9000...");
})
