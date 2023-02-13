
var axios = require('axios');

function criarTransacao(credencial, chave){

    var data = JSON.stringify({
    "lote": [
        {
        "data_vencimento": "12/30/2022",
        "data_pagamento": "12/20/2022",
        "valor": 230.95,
        "qrcode": "00020101021126950014BR.GOV.BCB.PIX2573spi.hom.cloud.pjbank.com.br/documentos/f2bc596c-5ad6-4b8b-9a01-6d11cfcf3d015204000053039865409999900.005802BR5910Fulano 6009SAOPAULO626005228rxZbFrWS4uaAW0Rz889AQ50300017BR.GOV.BCB.BRCODE01051.0.06304CF12",
        "nome_favorecido": "Empresa exemplo",
        "cnpj_favorecido": "55972934000187"
        }
    ]
    });

    var config = {
    method: 'post',
    url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/transacoes`,
    headers: { 
        'X-CHAVE-CONTA': `${chave}`, 
        'Content-Type': 'application/json'
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
}

module.exports = {criarTransacao};