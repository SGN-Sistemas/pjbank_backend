
var axios = require('axios');

function credenciarContaRecebimento(dadosEmpresa){

        var data = JSON.stringify({
            "nome_empresa": "Empresa de Exemplo",
            "conta_repasse": "99999-9",
            "agencia_repasse": "0001",
            "banco_repasse": "001",
            "cnpj": "50282264000153",
            "ddd": "19",
            "telefone": "40096830",
            "email": "atendimento@pjbank.com.br",
            "endereco": "Rua Joaquim Vilac, 509",
            "bairro": "Vila Teixeira",
            "cidade": "Campinas",
            "estado": "SP",
            "cep": "13301-510",
            "agencia": "0000"
        });

        var config = {

                method: 'post',
                url: 'https://sandbox.pjbank.com.br/recebimentos',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json'
                },
                data : data
        };

        return axios(config);
}

function infoCredencial(){

        var config = {
            method: 'get',
            url: 'https://sandbox.pjbank.com.br/recebimentos/f81254c1324447552e77dd306201c1f3c723e1c0',
            headers: { 
                'X-CHAVE': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549'
            }
        };

        axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
}

module.exports = {credenciarContaRecebimento, infoCredencial};