var axios = require('axios');

function criarContaDigital(){
     
        var data = JSON.stringify({
            "nome_empresa": "Exemplo Conta Digital",
            "cnpj": "20867577000102",
            "cep": "13032525",
            "endereco": "Rua Joaquim Vilac",
            "numero": "509",
            "bairro": "Vila Teixeira",
            "complemento": "",
            "cidade": "Campinas",
            "estado": "SP",
            "ddd": "19",
            "telefone": "987652345",
            "email": "api@pjbank.com.br",
            "webhook": "http://example.com.br"
        });

        var config = {
            method: 'post',
            url: 'https://sandbox.pjbank.com.br/contadigital',
            headers: { 
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

function addPessoaAdminContaDigital(){

        var data = JSON.stringify({
            "email": "matheus.pimentel@sgnsistemas.com.br"
        });
        
        var config = {
            method: 'post',
            url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/administradores',
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

function addSaldoContaDigital(){

        var data = JSON.stringify({
          "valor": "900.00"
        });

        var config = {
          method: 'post',
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

function addPagamentosContaDigital(){


         var config = {
            method: 'get',
            url: 'https://api.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/pagamentos?data_inicio=08/26/2022&data_fim=08/30/2022&itensporpagina=50&status=realizadas',
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

function listaAdminContaDigital(){

        var config = {
            method: 'get',
            url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/administradores',
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

function infoContaDigital(credencial, chave){

        var config = {
          method: 'get',
          url: `https://sandbox.pjbank.com.br/contadigital/${credencial}`,
          headers: { 
            'X-CHAVE-CONTA': `${chave}`
          }
        };

       return  axios(config);
        
}

function deletarPessoaContaDigital(pessoa_email){

        var data = '';

        var config = {
            method: 'delete',
            url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/administradores/'+pessoa_email,
            headers: { 
                'X-CHAVE-CONTA': 'e0bdd68a9fe7047367d9cc693e5e2482886a6549'
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

function statusCossioConta(pessoa_email){

    var config = {
        method: 'get',
        url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/administradores/' + pessoa_email,
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

function pagamentoComPix(pix, tipo_pix){

        var data = JSON.stringify({

        "lote": [
            {
            "data_vencimento": "12/30/2022",
            "data_pagamento": "12/20/2022",
            "valor": 230.95,
            "pix_tipo_chave": tipo_pix,
            "pix_chave": pix,
            "nome_favorecido": "Empresa exemplo",
            "cnpj_favorecido": "55972934000187"
            }
        ]
        });

        var config = {
            method: 'post',
            url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/transacoes',
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

function extraRecebimentosEfetivamentePagos(){

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

module.exports = {criarContaDigital, extrato_recebimentos, extraRecebimentosEfetivamentePagos , addPessoaAdminContaDigital, addSaldoContaDigital, addPagamentosContaDigital, listaAdminContaDigital, infoContaDigital, deletarPessoaContaDigital, statusCossioConta, pagamentoComPix};