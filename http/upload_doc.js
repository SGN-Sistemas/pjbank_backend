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

function listaDocumentosContaDigital(credencial, chave){

        var config = {
          method: 'get',
          url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/documentos`,
          headers: { 
            'X-CHAVE-CONTA': `${chave}`
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