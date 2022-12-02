require('express-async-errors')
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
 
app.use((error, req, res, next) => {

     res.status(500).json({message: error.message});
    
});

app.listen(65532, () => {

     console.log("Servidor rodando na porta 65532...");
})

