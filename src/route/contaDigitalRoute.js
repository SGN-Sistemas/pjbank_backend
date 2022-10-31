const express = require('express');
const router = express.Router();

const conta = require('../../http/admin_conta_digital');
const querys = require('../query/index');

router.get('/conta', (req, res) =>{

    let empresa_cod = req.query.empresa;

    (async () => {

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

          if(result_empresa.rowsAffected > 0){

                let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                let chave = result_empresa.recordset[0].CPEM_CHAVE;
    
                conta.infoContaDigital(credencial, chave)
                .then(function (response) {
                    console.log(JSON.stringify(response.data));
                    res.json(response.data);
                })
                .catch(function (error) {
                    console.log(error);
                    res.json(error);
                });

          }else{
                res.json({erro: 'Empresa não encontrada!'});
          }

          

    })()
});

module.exports = router;