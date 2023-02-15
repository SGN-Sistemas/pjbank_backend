var axios = require('axios');
require('dotenv/config');

const { PreparedStatementError } = require('mssql');

// function gerarBoletoContaPjbank(credencial, chave){

//     let composicao_array = [
//         {servico: 'Pintura', preco: 300.00},
//         {servico: 'Instalação elétrica', preco: '850.00'},
//         {servico: 'Aplicação de gesso', preco: '380.00'}
//     ]

//     let max = 0;

//        composicao_array.forEach((atual) => {

//             let t = atual.servico.length;

//             if(t > max){
//                 max = t;
//             }

//         });

//         console.log('tamanho maximo string');
//         console.log(max)

//         let tamanho = max;

//     let texto_total = composicao_array.reduce((acumulador, atual) => {

//             console.log(atual.servico.padEnd(tamanho,'.'));

//             let preco = atual.servico.padEnd(tamanho,'.') + '10.000,00'.padStart(61,'.');

//             return acumulador += preco+'\n';

//     }, '');

//     var data = JSON.stringify({

//             "vencimento": "10/30/2022",
//             "valor": 30000.00,
//             "juros": 0,
//             "multa": 0,
//             "desconto": "",
//             "nome_cliente": "Cliente de Exemplo",
//             "cpf_cliente": "62936576000112",
//             "endereco_cliente": "Rua Joaquim Vilac",
//             "numero_cliente": "509",
//             "complemento_cliente": "",
//             "bairro_cliente": "Vila Teixeira",
//             "cidade_cliente": "Campinas",
//             "estado_cliente": "SP",
//             "cep_cliente": "13301510",
//             "logo_url": "http://wallpapercave.com/wp/xK64fR4.jpg",
//             "texto": texto_total,
//             "grupo": "Boletos",
//             "webhook": "https://node-express-deply-heroku.herokuapp.com/webhook",
//             "pedido_numero": "2351"
//     });

//     var config = {

//         method: 'post',
//         url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes`,
//         headers: { 
//             'Content-Type': 'application/json'
//         },
//         data : data
//     };

//     axios(config)
//     .then(function (response) {
//         console.log(JSON.stringify(response.data));
//     })
//     .catch(function (error) {
//         console.log(error);
//     });

// }


function impressaoBoletosLote(credencial, chave, numeros_pedidos){

            var data = JSON.stringify({
                "pedido_numero": [...numeros_pedidos]
                
            });

            var config = {
            method: 'post',
            url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes/lotes`,
            headers: { 
                'Content-Type': 'application/json', 
                'X-CHAVE-CONTA': `${chave}`
            },
            data : data
            };

            return axios(config);
}

function impressaoBoletosCarne(credencial, chave, numeros_pedidos){

    console.log(numeros_pedidos)

    var data = JSON.stringify({
        "pedido_numero": [...numeros_pedidos],
        "formato": "carne"
    });

    console.log(data);

    var config = {
        method: 'post',
        url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes/lotes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`,
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);
}

function impressaoBoletosCarneSemContaDigital(credencial, chave, numeros_pedidos){

    var data = JSON.stringify({

        "pedido_numero": [
            ...numeros_pedidos
        ],
        "formato": "carne"
    });

    var config = {

        method: 'post',
        url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes/lotes`,
        headers: { 
            'X-CHAVE': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);

}

function consultarBoletosRecebimentoSemContaDigital(credencial, chave, dados){

    const data_inicio = dados.data_inicio ? 'data_inicio='+dados.data_inicio : '';
    const data_fim = dados.data_fim ? 'data_fim='+dados.data_fim : '';
    const pago = (dados.pago || dados.pago == 0) ? 'pago='+dados.pago : '';
    const pagina = dados.pagina ? 'pagina='+dados.pagina : '';

    let filtros = (data_inicio || data_fim || pago || pagina) ? '?' : '';


    filtros += ((data_inicio) ? data_inicio + '&' : '') + ((data_fim) ? data_fim + '&' : '') + ((pago) ? pago + '&' : '') + ((pagina) ? pagina + '&' : '');
    filtros = filtros.substring(0, filtros.length - 1);
    filtros = (filtros) ?? '';

    var config = {
            method: 'get',
            url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes${filtros}`,
            headers: { 
                'X-CHAVE': `${chave}`
            }
    };
      
      return axios(config);
}

function impressaoBoletosLoteSemContaDigital(credencial, chave, numeros_pedidos){

    var data = JSON.stringify({
        "pedido_numero": [...numeros_pedidos]
        
    });

    var config = {
        method: 'post',
        url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes/lotes`,
        headers: { 
            'Content-Type': 'application/json',
            'X-CHAVE': `${chave}`
        },
        data : data
    };

    return axios(config);
}

function invalidarBoleto(credencial, chave, pedido_numero){

            var data = '';

            var config = {
            method: 'delete',
            url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes/${pedido_numero}`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            },
            data : data
            };

            return axios(config);
           
}

function invalidarBoletoSemContaVirtual(credencial, chave, pedido_numero){

    var data = '';

    var config = {
        method: 'delete',
        url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes/${pedido_numero}`,
        headers: { 
            'X-CHAVE': `${chave}`
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
            url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes/${id_unico}`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            }
            };

            return axios(config);
            
}

function consultaBoletosRecebimentosFiltros(credencial, chave, data_inicio, data_fim, pagina = 1, pago = 0){

    var config = {
        method: 'get',
        url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes?data_inicio=${data_inicio}&data_fim=${data_fim}&pago=${pago}&pagina=${pagina}`,
        headers: { 
            'X-CHAVE': `${chave}`
        }
    };

    return axios(config);
   
}

function consultaBoletosPagamentosFiltros(credencial, chave, data_inicio, data_fim, pagina = 1, itensPorPagina = 50, status = 'realizadas'){

        var config = {
            method: 'get',
            url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/pagamentos?data_inicio=${data_inicio}&data_fim=${data_fim}&itensporpagina=${itensPorPagina}&pagina=${pagina}&status=${status}`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            }
        };

        return axios(config);
}



module.exports = {

    impressaoBoletosLote,
    invalidarBoleto,
    consultaPagamentoBoleto,
    consultaBoletosRecebimentosFiltros,
    consultaBoletosPagamentosFiltros,
    impressaoBoletosLoteSemContaDigital,
    invalidarBoletoSemContaVirtual,
    impressaoBoletosCarne,
    impressaoBoletosCarneSemContaDigital,
    consultarBoletosRecebimentoSemContaDigital
};