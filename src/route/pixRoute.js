const express = require('express');
const sql = require('mssql');

const config_conexao = require('../db/config_conexao');
const querys = require('../query/index');

const router = express.Router();
const operacoes_pix = require('../../http/pix');

router.post('/pix/pagamento', (req, res, next) => {

    console.log(req.body);
   
    let data_vencimento = req.body.vencimento;
    let data_pagamento = req.body.data_pagamento;
    let valor = req.body.valor;
    let nome_favorecido = req.body.nome_favorecido;
    let cnpj_favorecido = req.body.cnpj_favorecido;
    let empresa_cod = req.body.empresa;

    let tipo = 'E';

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

          if(result_empresa.rowsAffected <= 0){
               throw next(new Error("Sem dados das credenciais dessa empresa!"));
          }

          let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
          let chave = result_empresa.recordset[0].CPEM_CHAVE;

          let empr_clie_cod = empresa_cod;

          let dados_pix = await querys.getPix(empr_clie_cod, tipo);


          if(dados_pix.rowsAffected <= 0){
              throw next(new Error("Problema ao buscar os dados do pix!"));
          }

          let tipo_chave = dados_pix.recordset[0].CHPI_TIPO;
          let chave_pix = dados_pix.recordset[0].CHPI_CHAVE;

          let dados = {

                    "data_vencimento": data_vencimento,
                    "data_pagamento": data_pagamento,
                    "valor": valor,
                    "pix_tipo_chave": tipo_chave,
                    "pix_chave": chave_pix,
                    "nome_favorecido": nome_favorecido,
                    "cnpj_favorecido": cnpj_favorecido
          }

          operacoes_pix.pagamentoComPix(credencial, chave, dados)
          .then(function (response) {
                console.log(JSON.stringify(response.data));
                res.json(response.data);
          })
          .catch(function (error) {
                console.log(error.response.data);
                throw next(new Error(error.response.data.msg));
          });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});


module.exports = router;