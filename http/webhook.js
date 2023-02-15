var axios = require('axios');
require('dotenv/config');

function criarEditarWebHook(credencial, chave, url){

    var data = JSON.stringify({
      "webhook": `${url}`
    });

    var config = {
      method: 'put',
      url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}`,
      headers: { 
        'X-CHAVE-CONTA': `${chave}`, 
        'Content-Type': 'application/json'
      },
      data : data
    };

    return axios(config);

}

module.exports = {criarEditarWebHook};