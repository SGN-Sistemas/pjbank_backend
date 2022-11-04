const express = require('express');
const router = express.Router();

const conta = require('../../http/admin_conta_digital');
const querys = require('../query/index');
const limpaMascaras = require('../retiraMascaras/limpaMascara');

router.get('/conta', (req, res) => {

    let empresa_cod = req.query.empresa;

    (async () => {

        const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

        if (result_empresa.rowsAffected <= 0) {
            res.json({ erro: 'Empresa não encontrada!' });
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
                res.json(error);
            });

    })()
});

router.post('/conta', async (req, res) => {

    // let dadosEmpresa = {
    //     "nome_empresa": "Exemplo Conta Digital",
    //     "cnpj": "20867577000102",
    //     "cep": "13032525",
    //     "endereco": "Rua Joaquim Vilac",
    //     "numero": "509",
    //     "bairro": "Vila Teixeira",
    //     "complemento": "",
    //     "cidade": "Campinas",
    //     "estado": "SP",
    //     "ddd": "19",
    //     "telefone": "987652345",
    //     "email": "api@pjbank.com.br",
    //     "webhook": "http://example.com.br"
    // };


    const empresa_cod = req.query.empresa;

    const empresa = await querys.getDadosEmpresa(empresa_cod);

    if (empresa.rowsAffected <= 0) {
        console.log('Não foi encontrado os dados da empresa!');
        res.json({ erro: 'Não foi encontrado os dados da empresa!' });
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
            res.json({ erro: 'Não foi passado os dados da empresa!' });
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
                res.json({ erro: error.response.data });
            });

    })();

});

module.exports = router;