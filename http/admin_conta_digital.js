var axios = require('axios');

function criarContaDigital(dadosEmpresa){
     
        var data = JSON.stringify({
            "nome_empresa": dadosEmpresa.nome_empresa,
            "cnpj": dadosEmpresa.cnpj,
            "cep": dadosEmpresa.cep,
            "endereco": dadosEmpresa.endereco,
            "numero": dadosEmpresa.numero,
            "bairro": dadosEmpresa.bairro,
            "complemento": dadosEmpresa.complemento,
            "cidade": dadosEmpresa.cidade,
            "estado": dadosEmpresa.estado,
            "ddd": dadosEmpresa.ddd,
            "telefone": dadosEmpresa.telefone,
            "email": dadosEmpresa.email,
            "webhook": dadosEmpresa.webhook
        });

        var config = {
            method: 'post',
            url: 'https://api.pjbank.com.br/contadigital',
            headers: { 
                'Content-Type': 'application/json'
            },
            data : data
        };

        return axios(config);
}

function criarCredencialContaRecebimento(dadosEmpresa){
     
    var data = JSON.stringify({

        "nome_empresa": dadosEmpresa.nome_empresa,
        "conta_repasse": dadosEmpresa.conta_repasse,
        "agencia_repasse": dadosEmpresa.agencia_repasse,
        "banco_repasse": dadosEmpresa.banco_repasse,
        "cnpj": dadosEmpresa.cnpj,
        "ddd": dadosEmpresa.ddd,
        "telefone": dadosEmpresa.telefone,
        "email": dadosEmpresa.email,
        "endereco": dadosEmpresa.endereco,
        "bairro": dadosEmpresa.bairro,
        "cidade": dadosEmpresa.cidade,
        "estado": dadosEmpresa.estado,
        "cep": dadosEmpresa.cep,
        "agencia": dadosEmpresa.agencia

    });

    console.log(data);

    var config = {
        method: 'post',
        url: 'https://sandbox.pjbank.com.br/recebimentos',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data : data
    };

    return axios(config);
}

function addPessoaAdminContaDigital(credencial, chave, email){

        var data = JSON.stringify({
            "email": `${email}`
        });
        
        var config = {
            method: 'post',
            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/administradores`,
            headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
            },
            data : data
        };
        
        return axios(config);
}

function addSaldoContaDigital(credencial, chave, valor){

        var data = JSON.stringify({
          "valor": valor
        });

        var config = {
          method: 'post',
          url: `https://sandbox.pjbank.com.br/contadigital/${credencial}`,
          headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
          },
          data : data
        };

        return axios(config);
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

function listaAdminContaDigital(credencial, chave){

        var config = {
            method: 'get',
            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/administradores`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            }
        };

        return axios(config);
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

function deletarPessoaContaDigital(credencial, chave, pessoa_email){

        var data = '';

        var config = {
            method: 'delete',
            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/administradores/`+pessoa_email,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`
            },
            data : data
        };

        return axios(config);
}

function statusCossioConta(credencial, chave, pessoa_email){

    var config = {
        method: 'get',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/administradores/` + pessoa_email,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`
        }
    };

    return axios(config);
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
            url: 'https://api.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/transacoes',
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
            url: 'https://api.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes',
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
        url: 'https://api.pjbank.com.br/contadigital/f81254c1324447552e77dd306201c1f3c723e1c0/recebimentos/transacoes?pago=1',
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

function addDocumentoContaDigital(credencial, chave, data){

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

function transferenciaDocTed(credencial, chave, dados){

    var data = JSON.stringify({
        "lote": [
            {
                "data_vencimento": dados.data_vencimento,
                "data_pagamento": dados.data_pagamento,
                "valor": dados.valor,
                "banco_favorecido": dados.banco_favorecido,
                "agencia_favorecido": dados.agencia_favorecido,
                "conta_favorecido": dados.conta_favorecido,
                "cnpj_favorecido": dados.cnpj_favorecido,
                "nome_favorecido": dados.nome_favorecido,
                "descricao": "Pagamento de exemplo",
                "solicitante": dados.solicitante,
                "tipo_conta_favorecido": dados.tipo_conta_favorecido
            }
        ]
    });

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/transacoes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);

}


module.exports = {  criarContaDigital,
                    extrato_recebimentos,
                    extraRecebimentosEfetivamentePagos , 
                    addPessoaAdminContaDigital,
                    addSaldoContaDigital,
                    addPagamentosContaDigital,
                    listaAdminContaDigital, 
                    infoContaDigital,
                    deletarPessoaContaDigital,
                    statusCossioConta, 
                    pagamentoComPix,
                    addDocumentoContaDigital,
                    criarCredencialContaRecebimento,
                    transferenciaDocTed
                };