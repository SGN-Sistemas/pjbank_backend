var axios = require('axios');
require('dotenv/config');

function pagamentoComPix(credencial, chave, dados) {

    var data = JSON.stringify({
        "lote": [
            dados
        ]
    });

    var config = {
        method: 'post',
        url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/transacoes`,
        headers: {
            'X-CHAVE-CONTA': `${chave}`,
            'Content-Type': 'application/json'
        },
        data: data
    };

    return axios(config);
    
}

module.exports = {pagamentoComPix};