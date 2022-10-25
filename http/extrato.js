var axios = require('axios');

function extrato_recebimentos(){

    var config = {
        method: 'get',
        url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes',
        headers: { 
            'X-CHAVE-CONTA': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549'
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

function extrato_recebidos_efetivados(){
    var config = {
        method: 'get',
        url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes?pago=1',
        headers: { 
          'X-CHAVE-CONTA': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549', 
          'Content-Type': 'application/json'
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

function extrato_recebimento_filtro_data(data_inicio, data_fim){

    var config = {
    method: 'get',
    url: `https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes?data_inicio=${data_inicio}&data_fim=${data_fim}`,
    headers: { 
        'X-CHAVE-CONTA': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549'
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

module.exports = {extrato_recebimentos, extrato_recebidos_efetivados, extrato_recebimento_filtro_data};