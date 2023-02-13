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

function addPagamentosContaDigital(credencial, chave){

         var config = {
            method: 'get',
            url: `https://api.pjbank.com.br/contadigital/${credencial}/pagamentos?data_inicio=08/26/2022&data_fim=08/30/2022&itensporpagina=50&status=realizadas`,
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

function pagamentoComCodigoBarras(credencial, chave, data){

    dados = [data];

    console.log(dados);

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/transacoes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : dados
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

function pagamentoComPix(credencial, chave, pix, tipo_pix){

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
            url: `https://api.pjbank.com.br/contadigital/${credencial}/transacoes`,
            headers: { 
                'X-CHAVE-CONTA': `${chave}`, 
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

function extrato_recebimentos(credencial, chave){

        var config = {
            method: 'get',
            url: `https://api.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes`,
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

function extraRecebimentosEfetivamentePagos(credencial, chave){

        var config = {
        method: 'get',
        url: `https://api.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes?pago=1`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
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

function criarSubcontaCartaoCorporativo(credencial, chave, dados_empresa){

    var data = JSON.stringify({

        "data_nascimento": dados_empresa.data_nascimento,
        "sexo": dados_empresa.sexo,
        "tipo": dados_empresa.tipo,
        "valor": dados_empresa.valor,
        "cnpj": dados_empresa.cnpj,
        "nome_cartao": dados_empresa.nome_cartao,
        "cep": dados_empresa.cep,
        "endereco": dados_empresa.endereco,
        "numero": dados_empresa.numero,
        "bairro": dados_empresa.bairro,
        "complemento": dados_empresa.complemento,
        "cidade": dados_empresa.cidade,
        "estado": dados_empresa.estado,
        "ddd": dados_empresa.ddd,
        "telefone": dados_empresa.telefone,
        "email": dados_empresa.email
    });

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/subcontas`,
        headers: { 
            'Content-Type': 'application/json', 
            'X-CHAVE-CONTA': `${chave}`
        },
        data : data
    };

    return axios(config);

}

function consultarDadosSubconta(credencialConta, credencialSubconta , chave){

    var config = {
        method: 'get',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencialConta}/subcontas/${credencialSubconta}`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        }
    };

    return axios(config);

}

function transferenciaContaSubconta(credencialConta, credencialSubconta, chave){

    var data = JSON.stringify({
        "lote": [
            {
                "subconta_destino": `${credencialSubconta}`,
                "valor": "10.00",
                "data_pagamento": "12/10/2020"
            }
        ]
    });

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencialConta}/transacoes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);

}

function criarTokenCartaoCredito(credencial, chave, dados){

    var data = JSON.stringify({
        "nome_cartao": dados.nome_cartao,
        "numero_cartao": dados.numero_cartao,
        "mes_vencimento": dados.mes_vencimento,
        "ano_vencimento": dados.ano_vencimento,
        "cpf_cartao": dados.cpf_cartao,
        "email_cartao": dados.email_cartao,
        "celular_cartao": dados.celular_cartao,
        "codigo_cvv": dados.codigo_cvv
    });

    var config = {
        method: 'post',
        url: `https://api.pjbank.com.br/contadigital/${credencial}/recebimentos/tokens`,
        headers: { 
            'Content-Type': 'application/json', 
            'X-CHAVE-CONTA': `${chave}`
        },
        data : data
    };

    return axios(config);

}

function criarTransacaoUtilizandoToken(credencial, chave, token_cartao, dados_operacao){

    var data = JSON.stringify({
        "descricao_pagamento": dados_operacao.descricao_pagamento,
        "valor": dados_operacao.valor,
        "parcelas": dados_operacao.parcelas,
        "token_cartao": `${token_cartao}`
    });

    var config = {
        method: 'post',
        url: `https://api.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);

}

function criarTransacaoUtilizandoDadosCartao(credencial, chave, dados){

    var data = JSON.stringify({

        "numero_cartao": dados.numero_cartao,
        "nome_cartao": dados.nome_cartao,
        "mes_vencimento": dados.mes_vencimento,
        "ano_vencimento": dados.ano_vencimento,
        "cpf_cartao": dados.cpf_cartao,
        "email_cartao": dados.email_cartao,
        "celular_cartao": dados.celular_cartao,
        "codigo_cvv": dados.codigo_cvv,
        "valor": dados.valor,
        "parcelas": dados.parcelas,
        "descricao_pagamento": dados.descricao_pagamento
    });

    var config = {
        method: 'post',
        url: `https://api.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes`,
        headers: { 
            'Content-Type': 'application/json', 
            'X-CHAVE-CONTA': `${chave}`
        },
        data : data
    };

    return axios(config);

}

function cancelarTransacao(credencialConta, credencialSubconta_ou_token, chave){

    var data = '';

    var config = {

        method: 'delete',
        url: `https://api.pjbank.com.br/contadigital/${credencialConta}/recebimentos/transacoes/${credencialSubconta_ou_token}`,
        headers: { 
            'X-CHAVE-CONTA': `${chave}`, 
            'Content-Type': 'application/json'
        },
        data : data
    };

    return axios(config);

}

function transferenciaSubcontaConta(credencialConta, credencialSubconta, chave, data_vencimento, data_pagamento, valor){

    var data = JSON.stringify({
        "lote": [
            {
                "subconta_origem": `${credencialSubconta}`,
                "valor": `${valor}`,
                "data_vencimento": `${data_vencimento}`,
                "data_pagamento": `${data_pagamento}`,
                "conta_destino": `${credencialConta}`
            }
        ]
    });

    var config = {
        method: 'post',
        url: `https://sandbox.pjbank.com.br/contadigital/${credencialConta}/transacoes`,
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
                    transferenciaDocTed,
                    pagamentoComCodigoBarras,
                    consultarDadosSubconta,
                    transferenciaContaSubconta,
                    transferenciaSubcontaConta,
                    criarSubcontaCartaoCorporativo,
                    criarTokenCartaoCredito,
                    criarTransacaoUtilizandoToken,
                    criarTransacaoUtilizandoDadosCartao,
                    cancelarTransacao
                };