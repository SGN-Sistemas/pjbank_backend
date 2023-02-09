var axios = require('axios');
var FormData = require('form-data');
var fs = require('fs');
var data = new FormData();

function upload_documento(credencial, chave){

    data.append('arquivos', fs.createReadStream('./instrucoes_bat_pjbank.pdf'));
    data.append('tipo', 'contratosocial');

    var config = {
      method: 'post',
      url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/documentos`,
      headers: { 
          'X-CHAVE-CONTA': `${chave}`, 
          ...data.getHeaders()
      },
      data : data
    };

    return axios(config);
   
}

function listaDocumentosContaDigital(){

        var config = {
          method: 'get',
          url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/documentos',
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

module.exports = {upload_documento, listaDocumentosContaDigital};