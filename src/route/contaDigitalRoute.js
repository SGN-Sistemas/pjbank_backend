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
        "webhook": "http://129.148.50.73:9000/webhook"
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

    data.append('arquivos', fs.createReadStream(__dirname+'/instrucoes_bat_pjbank.pdf'));
    data.append('tipo', 'contratosocial');

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        console.log(credencial);
        console.log(chave);

        conta.addDocumentoContaDigital(credencial, chave, data)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error);
            res.json(error.message);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.post('/conta/administrador', async (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;
    let email = req.query.email;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.addPessoaAdminContaDigital(credencial, chave, email)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.get('/conta/administrador', (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.listaAdminContaDigital(credencial, chave)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.get('/conta/status_socio/administrador', (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;
    let email = req.query.email;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {

            res.json({"erro": 'Empresa não encontrada!'});
            // throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.statusCossioConta(credencial, chave, email)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});


router.post('/conta/add_saldo', async (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;
    let valor = req.query.valor;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.addSaldoContaDigital(credencial, chave, valor)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.delete('/conta/administrador', async (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;
    let email = req.query.email;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.deletarPessoaContaDigital(credencial, chave, email)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.post('/conta/transferencia/doc_ted', async (req, res, next) => {

    let credencial;
    let chave;

    let empresa_cod = req.query.empresa;
    let dados = req.body;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.transferenciaDocTed(credencial, chave, dados)
       .then(function (response) {
            console.log(JSON.stringify(response.data));
            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

router.post('/conta/pagamento_codigo_barras', async (req, res, next) => {

    const empresa_cod = req.query.empresa;

    const dados = req.body;

    let lote = {
        
            ...dados
    };

    console.log(lote);

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
    
            throw next(new Error('Empresa não encontrada!'));
        }

        credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
        chave = result_empresa.recordset[0].CPEM_CHAVE;

        conta.pagamentoComCodigoBarras(credencial, chave, lote)
        .then(async function (response) {

            console.log(JSON.stringify(response.data));

            res.json(response.data);
        })
        .catch(function (error) {
            console.log(error.response.data);
            res.json(error.response.data);
        });

    })()
    .then(resp => console.log(resp))
    .catch(err => console.log(err));

});

module.exports = router;