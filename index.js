const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser')
const app = express();
app.use(cors('*'));
app.use(bodyParser.json());

app.use('/', require('./src/route/boletoRoute'));
app.use('/', require('./src/route/contaDigitalRoute'));
app.use('/', require('./src/route/webHookRouter'));
 
app.listen(7000, () => {
 
     console.log("Servidor rodando na porta 7000...");
})

