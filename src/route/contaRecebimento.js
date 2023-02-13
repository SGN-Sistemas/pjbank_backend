const express = require('express');
const router = express.Router();

const conta = require('../../http/admin_conta_digital');
const extrato = require('../../http/extrato');
const querys = require('../query/index');
const limpaMascaras = require('../utilitarios/retiraMascaras/limpaMascara');

var axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
var data = new FormData();

router.get('/conta_recebimento', (req, res, next) => {

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
            
            res.json({erro: 'Empresa não encontrada!'});
            //throw next(new Error('Empresa não encontrada!'));
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
            res.json({erro: error});
            //throw next(new Error(error));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));
});

router.post('/conta_recebimento', async (req, res, next) => {

    const empresa_cod = req.query.empresa;

    console.log(empresa_cod);

    const empresa = await querys.getDadosEmpresa(empresa_cod);

    if (empresa.rowsAffected <= 0) {
        res.json({erro:'Não foi encontrado os dados da empresa!'});
        //throw next(new Error('Não foi encontrado os dados da empresa!'));
    }

    // const dadosBancarios = await querys.getDadosBancarios();

    let dadosBanco = {
        "conta_repasse": "99999-9",
        "agencia_repasse": "0001",
        "banco_repasse": "001",
        "agencia": "0000"
    };

    let dadosEmpresa = {
        "nome_empresa": empresa.recordset[0].EMPR_NOME,
        "conta_repasse": dadosBanco.conta_repasse,
        "agencia_repasse": dadosBanco.agencia_repasse,
        "banco_repasse": dadosBanco.banco_repasse,
        "cnpj": limpaMascaras.limpaMascaraCNPJ(empresa.recordset[0].EMPR_CGC),
        "ddd": "19",
        "telefone": limpaMascaras.limpaMascaraTelefone(empresa.recordset[0].EMPR_FONE),
        "email": empresa.recordset[0].EMPR_EMAIL,
        "endereco": empresa.recordset[0].EMPR_END,
        "bairro": empresa.recordset[0].EMPR_BAIRRO,
        "cidade": empresa.recordset[0].EMPR_CIDADE,
        "estado": empresa.recordset[0].EMPR_UNFE_SIGLA,
        "cep": limpaMascaras.limpaMascaraCEP(empresa.recordset[0].EMPR_CEP),
        "agencia": dadosBanco.agencia
    };

    let credencial_obj = {};

    (async () => {

        if (!dadosEmpresa) {
           res.json({erro: 'Não foi passado os dados da empresa!'});
           //throw next(new Error('Não foi passado os dados da empresa!'));
        }

        conta.criarCredencialContaRecebimento(dadosEmpresa)
        .then(async function (response) {

            console.log(JSON.stringify(response.data));

            credencial_obj.empresa_cod = empresa_cod;
            credencial_obj.credencial = response.data.credencial;
            credencial_obj.chave = response.data.chave;
            credencial_obj.chave_webhook = response.data.chave_webhook;
            credencial_obj.conta_virtual = response.data.conta_virtual;
            credencial_obj.agencia_virtual = response.data.agencia_virtual;

            let result = await querys.salvaCredenciaisEmpresaCredencial(credencial_obj);

            res.json(response.data);
        })
        .catch(function (error) {

            console.log(error.response.data.msg);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.get('/conta/extrato', (req, res, next) => {

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            res.json({erro:'Empresa não encontrada!'});
            //throw next(new Error('Empresa não encontrada!'));
        }

        let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        let chave = result_empresa.recordset[0].CPEM_CHAVE;

        extrato.extrato_recebimentos(credencial, chave)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
            res.json({erro: error});
            //throw next(new Error(error));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));
});

router.get('/conta/extrato/efetivamente_pagos', (req, res, next) => {

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
            
            res.json({erro: 'Empresa não encontrada!'});
            //throw next(new Error('Empresa não encontrada!'));
        }

        let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        let chave = result_empresa.recordset[0].CPEM_CHAVE;

        extrato.extrato_recebidos_efetivados(credencial, chave)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
            res.json({erro: error});
            //throw next(new Error(error));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));
});

router.get('/conta/extrato/filtro_data', (req, res, next) => {

    let empresa_cod = req.query.empresa;
    let data_inicio = req.query.data_inicio;
    let data_fim = req.query.data_fim;

    data_inicio = data_inicio.replaceAll("-", "/");
    data_fim = data_fim.replaceAll("-", "/");

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            res.json({erro: 'Empresa não encontrada!'});
            //throw next(new Error('Empresa não encontrada!'));
        }

        let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        let chave = result_empresa.recordset[0].CPEM_CHAVE;

        extrato.extrato_recebimento_filtro_data(credencial, chave, data_inicio, data_fim)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
            res.json({erro: error});
            //throw next(new Error(error));
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));
});

module.exports = router;