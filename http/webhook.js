var axios = require('axios')

function criarEditarWebHook(){

    var data = JSON.stringify({
      "webhook": "https://node-express-deply-heroku.herokuapp.com/webhook"
    });

    var config = {
      method: 'put',
      url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0',
      headers: { 
        'X-CHAVE-CONTA': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549', 
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

module.exports = {criarEditarWebHook};