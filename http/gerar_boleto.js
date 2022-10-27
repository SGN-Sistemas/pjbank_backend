var axios = require('axios');
const { PreparedStatementError } = require('mssql');

function gerarBoletoContaPjbank(){

    let composicao_array = [
        {servico: 'Pintura', preco: 300.00},
        {servico: 'Instalação elétrica', preco: '850.00'},
        {servico: 'Aplicação de gesso', preco: '380.00'}
    ]

    let max = 0;

       composicao_array.forEach((atual) => {

            let t = atual.servico.length;

            if(t > max){
                max = t;
            }

        });

        console.log('tamanho maximo string');
        console.log(max)

        let tamanho = max;

    let texto_total = composicao_array.reduce((acumulador, atual) => {

            console.log(atual.servico.padEnd(tamanho,'.'));

            let preco = atual.servico.padEnd(tamanho,'.') + '10.000,00'.padStart(61,'.');

            return acumulador += preco+'\n';

    }, '');

    var data = JSON.stringify({

            "vencimento": "10/30/2022",
            "valor": 30000.00,
            "juros": 0,
            "multa": 0,
            "desconto": "",
            "nome_cliente": "Cliente de Exemplo",
            "cpf_cliente": "62936576000112",
            "endereco_cliente": "Rua Joaquim Vilac",
            "numero_cliente": "509",
            "complemento_cliente": "",
            "bairro_cliente": "Vila Teixeira",
            "cidade_cliente": "Campinas",
            "estado_cliente": "SP",
            "cep_cliente": "13301510",
            "logo_url": "http://wallpapercave.com/wp/xK64fR4.jpg",
            "texto": texto_total,
            "grupo": "Boletos",
            "webhook": "https://node-express-deply-heroku.herokuapp.com/webhook",
            "pedido_numero": "2351"
    });

    var config = {

        method: 'post',
        url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes',
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

function gerarBoletoSemPjbank(){

    var axios = require('axios');

    var data = JSON.stringify({

        "vencimento": "10/30/2022",
        "valor": ".00",
        "juros": "0",
        "juros_fixo": "0",
        "multa": "0",
        "multa_fixo": "0",
        "nome_cliente": "Cliente de Exemplo",
        "email_cliente": "cliente.exemplo@pjbank.com.br",
        "telefone_cliente": "1940096830",
        "cpf_cliente": "62936576000112",
        "endereco_cliente": "Rua Joaquim Vilac",
        "numero_cliente": "509",
        "bairro_cliente": "Vila Teixeira",
        "cidade_cliente": "Campinas",
        "estado_cliente": "SP",
        "cep_cliente": "13301510",
        "logo_url": "https://pjbank.com.br/assets/images/logo-pjbank.png",
        "texto": "Texto opcional",
        "instrucoes": "Este é um boleto de exemplo",
        "instrucao_adicional": "Este boleto não deve ser pago pois é um exemplo",
        "grupo": "Boletos001",
        "webhook": "https://node-express-deply-heroku.herokuapp.com/webhook",
        "pedido_numero": "89724",
        "especie_documento": "DS"
    });

    var config = {

        method: 'post',
        url: 'https://sandbox.pjbank.com.br/recebimentos/f81254c1324447552e77dd306201c1f3c723e1c0/transacoes',
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

function impressaoBoletosLote(){

            var data = JSON.stringify({
            "pedido_numero": [
                "2",
                "3",
                "4"
                
            ]
                
            });

            var config = {
            method: 'post',
            url: 'https://sandbox.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes/lotes',
            headers: { 
                'Content-Type': 'application/json', 
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

function invalidarBoleto(credencial, chave, pedido_numero){

            var data = '';

            var config = {
            method: 'delete',
            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes/${pedido_numero}`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            },
            data : data
            };

            return axios(config);
           
}


function consultaPagamentoBoleto(credencial, chave, id_unico){

    // registro_sistema_bancario - atributo para verificar se o boleto já foi registratdo no banco
    // caso ainda não tenha sido registrado estará com o status de 'pendente'

    // atributo 'data_pagamento' para saber se já foi pago!

    // Atributo 'link_info' é um link de uma página que traz informações sobre o boleto
    var data = '';

            var config = {
            method: 'get',
            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes/${id_unico}`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            }
            };

            return axios(config);
            
}

module.exports = {gerarBoletoSemPjbank,gerarBoletoContaPjbank, impressaoBoletosLote, invalidarBoleto, consultaPagamentoBoleto};