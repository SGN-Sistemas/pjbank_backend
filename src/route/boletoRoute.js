const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const sql = require('mssql');
const fs = require('fs');

const datas = require('../../src/datas_formatadas');
const smtp = require('../../src/smtp/config_smtp');
const email = require('../../src/smtp/enviar_email');
const operacoes_boletos = require('../../http/gerar_boleto');
const config_conexao = require('../db/config_conexao');
const querys = require('../query/index');

const router = express.Router();

let array_parcelas;

let obj_result = {};

let credencial;

// let exists_boletos;
// let credencial;

router.post('/boleto', (req, res) => {

    const transporter = nodemailer.createTransport(smtp.smtp);
    let dado_parcela;

    (async () => {
          const transporter = nodemailer.createTransport(smtp.smtp);
    let dados_parcela = [];
    (async () => {
          let codigos = req.body.parcelas;
          console.log(codigos)
          try {
 
                const dados_cobranca = await querys.dadosCobrancaTrParcelaRc(codigos);
                console.log("Dados da cobrança!")
                console.log(dados_cobranca.recordset[0]);
                let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;
 
                const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);
                console.log(result_empresa.recordset[0].CPEM_CREDENCIAL);
                let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                let url_webhook = result_empresa.recordset[0].CPEM_URL_WEBHOOK;
                let url_logo = result_empresa.recordset[0].CPEM_URL_LOGO;
                const exists_boletos = await sql.query`SELECT
                                                                 BCPJ_COD
                                                           FROM
                                                                 BOLETO_COBRANCA_PJBANK
                                                           WHERE
                                                                 BCPJ_PEDIDO_NUMERO IN (${codigos})`;
                console.log(exists_boletos);
                dados_parcela = [...dados_cobranca.recordset];
 
                const result_cliente = await querys.dadosCliente(cliente_cod);
                let cliente = result_cliente.recordset[0];
                let nome_cliente;
                let cpf_cliente;
                let uf_cliente;
                let cidade_cliente;
                let endereco_cliente;
                let bairro_cliente;
                let cep_cliente;
                let email_cliente;

                if (result_cliente.recordset.length <= req.body.parcelas.length) {
                      if (result_cliente.recordset[0].CLIE_TIPO == 'F') {

                            nome_cliente = cliente.CLIE_NOME;
                            pf_cliente = cliente.PEFI_CPF;
                            uf_cliente = cliente.PEFI_UNFE_SIGLA;
                            cidade_cliente = cliente.PEFI_CIDADE;
                            endereco_cliente = cliente.PEFI_END;
                            bairro_cliente = cliente.PEFI_BAIRRO;
                            cep_cliente = cliente.PEFI_CEP;
                            email_cliente = cliente.PEFI_EMAIL;

                      } else if (result_cliente.recordset[0].CLIE_TIPO == 'J') {

                            nome_cliente = cliente.CLIE_NOME;
                            cpf_cliente = cliente.PEJU_CGC;
                            uf_cliente = cliente.PEJU_UNFE_SIGLA_COBR;
                            cidade_cliente = cliente.PEJU_CIDADE;
                            endereco_cliente = cliente.PEJU_END;
                            bairro_cliente = cliente.PEJU_BAIRRO;
                            cep_cliente = cliente.PEJU_CEP_COBR;
                            email_cliente = cliente.PEJU_EMAIL;

                      }
                } else {
                      nome_cliente = cliente.CLIE_NOME;
                      cpf_cliente = cliente.PEFI_CPF;
                      uf_cliente = cliente.PEFI_UNFE_SIGLA;
                      cidade_cliente = cliente.PEFI_CIDADE;
                      endereco_cliente = cliente.PEFI_END;
                      bairro_cliente = cliente.PEFI_BAIRRO;
                      cep_cliente = cliente.PEFI_CEP;
                      email_cliente = cliente.PEFI_EMAIL;
                }
                let data_formatada;
                array_parcelas = dados_parcela.map((parcela) => {
                  console.log('data direto da requisição');
                  console.log(parcela.TRPR_DTVENC)
                      data_formatada = datas.getFormatDate(parcela.TRPR_DTVENC);
                      console.log(data_formatada)
                      let obj = {
                            "vencimento": data_formatada,
                            "valor": parcela.TRPR_VALPREV,
                            "juros": parcela.TRPR_VALJUR,
                            "multa": parcela.TRPR_VALMULTA,
                            "desconto": parcela.TRPR_VALDESC,
                            "nome_cliente": nome_cliente,
                            "cpf_cliente": cpf_cliente,
                            "endereco_cliente": endereco_cliente,
                            "numero_cliente": "509",
                            "complemento_cliente": "",
                            "bairro_cliente": bairro_cliente,
                            "cidade_cliente": cidade_cliente,
                            "estado_cliente": uf_cliente,
                            "cep_cliente": cep_cliente,
                            "logo_url": (url_logo) ? url_logo : "",
                            "texto": "Texto padrão personalizavel",
                            "grupo": "Boletos",
                            "pedido_numero": parcela.TRPR_COD,
                            "webhook": url_webhook,
                            "texto": "Exemplo de emissão de boleto",
                            "instrucoes": "Este é um boleto de exemplo",
                            "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo"
                      }
                      return obj;
                });
                console.log('Teste novo array');
                console.log(dados_parcela)
                console.log('array parecelas')
                console.log(array_parcelas);
                if (exists_boletos.rowsAffected[0] <= 0) {
                      var data = JSON.stringify({
                            "cobrancas": [...array_parcelas]
                      });
                      var config = {
                            method: 'post',
                            url: `https://sandbox.pjbank.com.br/contadigital/${credencial}/recebimentos/transacoes`,
                            headers: {
                                  'Content-Type': 'application/json'
                            },
                            data: data
                      };
                      axios(config)
                            .then(async function (response) {
                                  let dados = null;
                                   console.log('teste')
                                  console.log(response.data)
                                  if (response.data) {
                                        dados = response.data;
 
                                        obj_result.mensagem = "Boletos gerados com sucesso";
                                        let contador = 0;
                                        obj_result.boleto = [];
                                        let cont = 1;
                                        
                                        if(Array.isArray(response.data)){
 
                                               response.data.filter(data => data.status != '400').forEach((boleto) => {
                                                     console.log(boleto)
                                                     obj_result.boleto.push({ id: cont, link: boleto.linkBoleto });
                                                     cont++;
    
                                               })
 
                                        }else{
                                               obj_result.boleto.push({ id: cont, link: response.data.linkBoleto });
                                               cont++;
                                        }
                                        let n = 1;
                                        let links_boletos = obj_result.boleto.reduce((acumulador, atual) => {
                                              acumulador += "Boleto " + n + ": " + atual.link + '\n';
                                              n++;
                                              return acumulador;
 
                                        }, '');
                                        console.log(links_boletos);
 
                                       // email_cliente
                                        email.enviar_email('sac@sgnsistemas.com.br', 'matheus.pimentel@sgnsistemas.com.br', 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
                                        if (dados) {
                                              console.log(dados);
                                        
                                           if(Array.isArray(dados)){
                                              dados.forEach(async (dado) => {
                                                    querys.atualizaBoletoBanco(dado);
                                              });
 
                                           }else{
                                               querys.atualizaBoletoBanco(dados);
                                               console.log("Não é array");
                                           }
                                        }
                                        obj_result.erro = [];
                                       
                                        res.json(obj_result);
                                  } else {
                                        res.json('Problema na requisição')
                                  }
                            })
                            .catch(function (error) {
                                  console.log(error);
                                  res.json({ 'boleto': 'Problema na requisição' })
                            });
                } else {
                      console.log("Existem parcelas que já foram emitidas!");
                      res.json("Existem parcelas que já foram emitidas!");
                }
          } catch (err) {
                console.log(err);
          }
    })()

    })()

  
});

router.get('/boleto', (req, res) => {

      let pedido_numero = req.query.pedido;
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if (result_empresa.rowsAffected > 0) {

                  let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                  let chave = result_empresa.recordset[0].CPEM_CHAVE;
                  const result_id_unico = await querys.getBoletoCobrancaPjBank(pedido_numero);

                  console.log(result_id_unico)

                  if (result_id_unico.rowsAffected > 0) {

                        let id_unico = result_id_unico.recordset[0].BCPJ_ID_UNICO;

                        operacoes_boletos.consultaPagamentoBoleto(credencial, chave, id_unico)
                              .then(async function (response) {

                                    console.log(response.data);
                                    res.json(response.data);
                              })
                              .catch(function (error) {
                                    console.log(error);
                                    res.json(error);
                              });

                  } else {

                        res.json({ erro: "Não foi encontrado o boleto de cobrança para este número de pedido!" });
                  }

            } else {
                  res.json({ erro: "Sem dados das credenciais dessa empresa!" });
            }
      })();

});

router.get('/boleto/lote', (req, res) => {

      let pedido_numero = req.query.pedido.split('-');
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if (result_empresa.rowsAffected > 0) {

                  let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                  let chave = result_empresa.recordset[0].CPEM_CHAVE;
                  const dadosCobranca = await querys.getBoletoCobrancaPjBank(pedido_numero);

                  console.log(dadosCobranca);

                  if (dadosCobranca.rowsAffected > 0) {

                        let numeros_pedidos = dadosCobranca.recordset.map(item => item.BCPJ_PEDIDO_NUMERO);

                        operacoes_boletos.impressaoBoletosLote(credencial, chave, numeros_pedidos)
                              .then(function (response) {
                                    console.log(JSON.stringify(response.data));
                                    res.json(response.data);
                              })
                              .catch(function (error) {
                                    console.log(error);
                                    res.json(error);
                              });

                  } else {

                        res.json({ erro: "Não foi encontrado o boleto de cobrança para estes números de pedido!" });
                  }

            } else {
                  res.json({ erro: "Sem dados das credenciais dessa empresa!" });
            }
      })();

});

router.get('/boleto/filtros', (req, res) => {

      let empresa_cod = req.query.empresa;
      let data_inicio = req.query.data_inicio.replaceAll('-', '/');
      let data_fim = req.query.data_fim.replaceAll('-', '/');
      let pagina = 1;
      let pago = req.query.pago;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if (result_empresa.rowsAffected > 0) {

                  let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                  let chave = result_empresa.recordset[0].CPEM_CHAVE;

                  operacoes_boletos.consultaBoletosRecebimentosFiltros(credencial, chave, data_inicio, data_fim, pagina, pago)
                        .then(function (response) {
                              console.log(JSON.stringify(response.data));
                              res.json(response.data);
                        })
                        .catch(function (error) {
                              console.log(error);
                              res.json(error);
                        });

            } else {
                  res.json({ erro: "Sem dados das credenciais dessa empresa!" });
            }
      })();

});

router.get('/boleto/pagamentos/filtros', (req, res) => {

      let empresa_cod = req.query.empresa;
      let data_inicio = req.query.data_inicio.replaceAll('-', '/');
      let data_fim = req.query.data_fim.replaceAll('-', '/');
      let status = req.query.status;
      let pagina = 1;
      let itensPorPagina = 50;

      console.log(data_inicio);
      console.log(data_fim);

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if (result_empresa.rowsAffected > 0) {

                  let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                  let chave = result_empresa.recordset[0].CPEM_CHAVE;

                  operacoes_boletos.consultaBoletosPagamentosFiltros(credencial, chave, data_inicio, data_fim, pagina, itensPorPagina, status)
                        .then(function (response) {
                              console.log(JSON.stringify(response.data));
                              res.json(response.data);
                        })
                        .catch(function (error) {
                              console.log(error);
                              res.json(error);
                        });

            } else {
                  res.json({ erro: "Sem dados das credenciais dessa empresa!" });
            }
      })();

});

router.delete('/boleto', (req, res) => {

      let pedido_numero = req.query.pedido;
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            operacoes_boletos.invalidarBoleto(credencial, chave, pedido_numero)
                  .then(function (response) {
                        console.log(JSON.stringify(response.data));
                        res.json(response.data);
                  })
                  .catch(function (error) {
                        console.log(error);
                        res.json(error);
                  });

      })();

});

module.exports = router;



