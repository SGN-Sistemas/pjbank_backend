var axios = require('axios');

function extrato_recebimentos(credencial, chave){

    var config = {
        method: 'get',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`
        }
    };

    return axios(config);
}

function extrato_recebidos_efetivados(credencial, chave){

    var config = {
        method: 'get',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes?pago=1`,
        headers: { 
          'X-CHAVE-CONTA': `${chave}`, 
          'Content-Type': 'application/json'
        }
      };
      
      return axios(config);
}

function extrato_recebimento_filtro_data(credencial, chave, data_inicio, data_fim){

    var config = {
        method: 'get',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes?data_inicio=${data_inicio}&data_fim=${data_fim}`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`
        }
    };

    return axios(config);
    
}

module.exports = {extrato_recebimentos, extrato_recebidos_efetivados, extrato_recebimento_filtro_data};