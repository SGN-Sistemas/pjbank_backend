var express = require('express');
const router = express.Router();
const { postWebHook } = require('../webhook/post');
const { putWebHook } = require('../webhook/put');
const { deleteWebHook } = require('../webhook/delete');
const { getWebHook } = require('../webhook/get');
const { criarEditarWebHook } = require('../../http/webhook');
const sql = require('mssql');
const config_conexao = require('../db/config_conexao');
const querys = require('../query/index');

router.get('/webhook', getWebHook);

router.post('/webhook', postWebHook);

router.put('/webhook', putWebHook);

router.delete('/webhook', deleteWebHook);

router.put('/webhook/config', (req, res, next) => {

    let empresa_cod = req.query.empresa;
    let url = req.body.url;

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

          if(result_empresa.rowsAffected <= 0){
                //throw next(new Error("Sem dados das credenciais dessa empresa!"));
                res.json({"erro": "Sem dados das credenciais dessa empresa!"});
          }

          let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
          let chave = result_empresa.recordset[0].CPEM_CHAVE;

          console.log(credencial)
          console.log(chave)

          criarEditarWebHook(credencial, chave, url)
          .then(function (response) {
                console.log('entrou no then')
                console.log(JSON.stringify(response.data));
                res.json(response.data);
          })
          .catch(function (error) {
                console.log('entrou no catch')
                console.log(error);
                res.json(error);
                // throw next(new Error(error));
          });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

module.exports = router;