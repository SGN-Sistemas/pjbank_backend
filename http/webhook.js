var axios = require('axios');

function criarEditarWebHook(credencial, chave, url){

    var data = JSON.stringify({
      "webhook": `${url}`
    });

    var config = {
      method: 'put',
      url: `https://sandbox.pjbank.com.br/contadigital/${credencial}`,
      headers: { 
        'X-CHAVE-CONTA': `${chave}`, 
        'Content-Type': 'application/json'
      },
      data : data
    };

    return axios(config);

    // .then(function (response) {
    //   console.log(JSON.stringify(response.data));
    // })
    // .catch(function (error) {
    //   console.log(error);
    // });

}

module.exports = {criarEditarWebHook};