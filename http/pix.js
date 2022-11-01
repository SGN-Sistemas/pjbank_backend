var axios = require('axios');

function pagamentoComPix(credencial, chave, dados) {

    var data = JSON.stringify({
        "lote": [
            dados
        ]
    });

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/transacoes`,
        headers: {
            'X-CHAVE-CONTA': `${chave}`,
            'Content-Type': 'application/json'
        },
        data: data
    };

    return axios(config);
    
}

module.exports = {pagamentoComPix};