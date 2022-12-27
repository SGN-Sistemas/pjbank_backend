const express = require('express');
const router = express.Router();

const conta = require('../../http/admin_conta_digital');
const querys = require('../query/index');
const limpaMascaras = require('../utilitarios/retiraMascaras/limpaMascara');

var axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
var data = new FormData();

router.get('/conta', (req, res, next) => {

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        let chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.infoContaDigital(credencial, chave)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
            throw next(new Error(error));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));
});

router.post('/conta', async (req, res, next) => {

    const empresa_cod = req.query.empresa;

    const empresa = await querys.getDadosEmpresa(empresa_cod);

    if (empresa.rowsAffected <= 0) {
        throw next(new Error('Não foi encontrado os dados da empresa!'));
    }

    let dadosEmpresa = {
        "nome_empresa": empresa.recordset[0].EMPR_NOME,
        "cnpj": limpaMascaras.limpaMascaraCNPJ(empresa.recordset[0].EMPR_CGC),
        "cep": limpaMascaras.limpaMascaraCEP(empresa.recordset[0].EMPR_CEP),
        "endereco": empresa.recordset[0].EMPR_END,
        "numero": "509",
        "bairro": empresa.recordset[0].EMPR_BAIRRO,
        "complemento": "",
        "cidade": empresa.recordset[0].EMPR_CIDADE,
        "estado": empresa.recordset[0].EMPR_UNFE_SIGLA,
        "ddd": "19",
        "telefone": limpaMascaras.limpaMascaraTelefone(empresa.recordset[0].EMPR_FONE),
        "email": empresa.recordset[0].EMPR_EMAIL,
        "webhook": "http://example.com.br"
    };

    let credencial_obj = {};

    (async () => {

        if (!dadosEmpresa) {
           throw next(new Error('Não foi passado os dados da empresa!'));
        }

        conta.criarContaDigital(dadosEmpresa)
        .then(async function (response) {

            console.log(JSON.stringify(response.data));

            credencial_obj.empresa_cod = empresa_cod;
            credencial_obj.credencial = response.data.credencial;
            credencial_obj.chave = response.data.chave;
            credencial_obj.webhook_chave = response.data.webhook_chave;

            let result = await querys.salvaCredenciaisEmpresa(credencial_obj);

            res.json(response.data);
        })
        .catch(function (error) {

            console.log(error.response.data.msg);
            throw next(new Error(error.response.data));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});


router.post('/conta/documentos', async (req, res, next) => {

    data.append('arquivos', fs.createReadStream('/path/to/file'));
    data.append('tipo', 'contratosocial');

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        let chave = result_empresa.recordset[0].CPEM_CHAVE;

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/documentos`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            ...data.getHeaders()
        },
        data : data
    };

    axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });

});


module.exports = router;