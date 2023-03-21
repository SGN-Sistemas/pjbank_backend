const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const sql = require('mssql');
require('dotenv/config');

const download = require('../utils/dowload');

const datas = require('../../src/datas_formatadas');
const smtp = require('../../src/smtp/config_smtp');
const email = require('../../src/smtp/enviar_email');
const operacoes_boletos = require('../../http/gerar_boleto');
const config_conexao = require('../db/config_conexao');
const querys = require('../query/index');
const utilitarios = require('../utilitarios/verificaExisteEmpresaIgual');
const download_pdf = require('../utilitarios/download_pdf.js');
const { json } = require('body-parser');
const { response } = require('express');

const router = express.Router();

let array_parcelas;

let obj_result = {};

let credencial;
let email_cliente;

router.post('/boleto', (req, res, next) => {

      let codigos = req.body.parcelas;
      let email_req = req.body.email;
      let tr = req.body.tr;
      let nome_arq = req.body.nome_arq;

      console.log('nomeArq');

      console.log(nome_arq);

      console.log('codigos')

      console.log(codigos)

      let tr_codigos = tr == 1 ? codigos : '';

      let nome_arquivo = nome_arq != 0 ? nome_arq : '';

      console.log('nome_arquivo');

      console.log(nome_arquivo);

      console.log('array de trs')
      console.log(tr_codigos)

      // Boleto, pix ou Pix e Boleto
      let forma_pagamento = req.body.forma;

      console.log(codigos);
      console.log(email_req);

      const transporter = nodemailer.createTransport(smtp.smtp);
      let dado_parcela;

      (async () => {

            const transporter = nodemailer.createTransport(smtp.smtp);
            let dados_parcela = [];

            (async () => {

                  try {

                        const dados_cobranca = await querys.dadosCobrancaTrParcelaRc(codigos);

                        let igual = utilitarios.verificaExisteClienteIgual(dados_cobranca.recordset);

                        if (igual) {

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              console.log(cliente_cod);
                              console.log(empresa_cod);

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
                              let cliente = result_cliente.recordset;
                              let nome_cliente;
                              let cpf_cliente;
                              let uf_cliente;
                              let cidade_cliente;
                              let endereco_cliente;
                              let bairro_cliente;
                              let cep_cliente;
                              let email_cliente;
                              let telefone_cliente;

                              nome_cliente = cliente[0].CLIE_NOME;
                              cpf_cliente = cliente[0].CPF;
                              uf_cliente = cliente[0].UNFE;
                              cidade_cliente = cliente[0].CIDADE;
                              endereco_cliente = cliente[0].ENDERECO;
                              bairro_cliente = cliente[0].BAIRRO;
                              cep_cliente = cliente[0].CEP;
                              email_cliente = cliente[0].EMAIL;
                              telefone_cliente = cliente[0].TELEFONE;

                              let data_formatada;
                              array_parcelas = dados_parcela.map((parcela) => {

                                    data_formatada = datas.getFormatDate(parcela.TRPR_DTVENC);

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
                                          "texto": parcela.TRPR_OBS,
                                          "pix": forma_pagamento,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo"
                                    }
                                    return obj;
                              });

                              if(exists_boletos.rowsAffected[0] > 0){
                                    //res.json({erro: "Existem parcelas que já foram emitidas!"});
                                    throw next(new Error("Existem parcelas que já foram emitidas!"));
                              }

                              var data = JSON.stringify({
                                    "cobrancas": [...array_parcelas]
                              });

                              console.log('antes da requisição');

                              var config = {
                                    method: 'post',
                                    url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes`,
                                    headers: {
                                          'Content-Type': 'application/json'
                                    },
                                    data: data
                              };

                              console.log('depois da requisição');

                              axios(config)
                                    .then(async function (response) {

                                          console.log('entrou no then');

                                          let dados = null;
                                          console.log('teste');
                                          console.log(response.data);

                                          if(!response.data){
                                                //res.json({"erro": "Problema na requisição!"});
                                                throw next(new Error("Problema na requisição!"));
                                          }

                                          console.log('entrou no then 2');

                                          dados = response.data;

                                          obj_result.mensagem = "Boletos gerados com sucesso";
                                          let contador = 0;
                                          obj_result.boleto = [];
                                          let cont = 1;

                                          if (Array.isArray(response.data)) {

                                                console.log('entrou no if do then');

                                                response.data.filter(data => data.status != '400').forEach((boleto) => {
                                                            console.log(boleto)
                                                            obj_result.boleto.push({ id: cont, link: boleto.linkBoleto });
                                                            cont++;

                                                });

                                          }else {

                                                console.log('entrou no if do then 2');

                                                obj_result.boleto.push({ id: cont, link: response.data.linkBoleto });
                                                cont++;
                                          }

                                          let n = 1;

                                          let links_boletos = obj_result.boleto.reduce((acumulador, atual) => {

                                                acumulador += "Boleto " + n + ": " + atual.link + '\n';
                                                n++;
                                                return acumulador;

                                          }, '');

                                          // email_cliente

                                          console.log('antes do email');

                                          if (email_req == 1) {
                                                email.enviar_email('sac@sgnsistemas.com.br', email_cliente, 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
                                          }


                                          if(!dados){
                                                console.log("Não entrou no if de dados");
                                          }

                                          console.log(dados);

                                          if (Array.isArray(dados)) {

                                                console.log('entrou no if 2 do then');

                                                dados.forEach(async (dado) => {
                                                      querys.atualizaBoletoBanco(dado);
                                                });

                                          }else {

                                                console.log('entrou no else 2 do then');

                                                querys.atualizaBoletoBanco(dados);
                                                console.log("Não é array");
                                          }

                                          console.log('kkkkkk')

                                          obj_result.erro = [];

                                          console.log('antes do pdf');

                                          obj_result.boleto.forEach(async (ele, index) => {

                                                if(nome_arquivo){

                                                      download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', nome_arquivo);

                                                }else if(tr_codigos){

                                                      download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', tr_codigos[index]);

                                                }else{

                                                      download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

                                                }

                                          });

                                          console.log('depois do pdf')

                                          console.log(obj_result)

                                          res.json(obj_result);

                                    })
                                    .catch(function (error) {
                                          //throw next(new Error("Problema na requisição!"));
                                          console.log('entrou nesse catch erro')
                                          res.json(error.response.data);
                                          console.log(error.response.data);
                                    });

                        } else {

                              console.log("Clientes diferentes");

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

                              let arrays_emails = dados_parcela.map(async parc => {

                                    let cliente_cod = parc.CLIE_TIPO_COD;

                                    const result_cliente = await querys.dadosCliente(cliente_cod);

                                    return result_cliente.recordset[0].PEFI_EMAIL;
                              });

                              let data_formatada;
                              array_parcelas = dados_parcela.map(async (parcela) => {

                                    const result_cliente = await querys.dadosCliente(parcela.CLIE_TIPO_COD);
                                    let cliente = result_cliente.recordset;
                                    let nome_cliente;
                                    let cpf_cliente;
                                    let uf_cliente;
                                    let cidade_cliente;
                                    let endereco_cliente;
                                    let bairro_cliente;
                                    let cep_cliente;
                                    let email_cliente;
                                    let telefone_cliente;

                                    nome_cliente = cliente[0].CLIE_NOME;
                                    cpf_cliente = cliente[0].CPF;
                                    uf_cliente = cliente[0].UNFE;
                                    cidade_cliente = cliente[0].CIDADE;
                                    endereco_cliente = cliente[0].ENDERECO;
                                    bairro_cliente = cliente[0].BAIRRO;
                                    cep_cliente = cliente[0].CEP;
                                    email_cliente = cliente[0].EMAIL;
                                    telefone_cliente = cliente[0].TELEFONE;

                                    data_formatada = datas.getFormatDate(parcela.TRPR_DTVENC);

                                    let obj = {
                                          "vencimento": data_formatada ? data_formatada : "",
                                          "valor": parcela.TRPR_VALPREV ? parcela.TRPR_VALPREV : "",
                                          "juros": parcela.TRPR_VALJUR ? parcela.TRPR_VALJUR : "",
                                          "multa": parcela.TRPR_VALMULTA ? parcela.TRPR_VALMULTA : "",
                                          "desconto": parcela.TRPR_VALDESC ? parcela.TRPR_VALDESC : "",
                                          "nome_cliente": nome_cliente ? nome_cliente : "",
                                          "cpf_cliente": cpf_cliente ? cpf_cliente : "",
                                          "endereco_cliente": endereco_cliente ? endereco_cliente : "",
                                          "numero_cliente": "509",
                                          "complemento_cliente": "",
                                          "bairro_cliente": bairro_cliente ? bairro_cliente : "",
                                          "cidade_cliente": cidade_cliente ? cidade_cliente : "",
                                          "estado_cliente": uf_cliente ? uf_cliente : "",
                                          "cep_cliente": cep_cliente ? cep_cliente : "",
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": "Texto padrão personalizavel",
                                          "grupo": "Boletos",
                                          "pedido_numero": parcela.TRPR_COD ? parcela.TRPR_COD : "",
                                          "webhook": url_webhook ? url_webhook : "",
                                          "texto": parcela.TRPR_OBS ? parcela.TRPR_OBS : "",
                                          "pix": forma_pagamento,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo"
                                    }
                                    return obj;
                              });

                              let array_result = [];

                              Promise.all([...array_parcelas])
                                    .then(response => {

                                          console.log(response)

                                          if (exists_boletos.rowsAffected[0] <= 0) {

                                                var data = JSON.stringify({
                                                      "cobrancas": response
                                                });

                                                var config = {
                                                      method: 'post',
                                                      url: `${process.env.PRE_URL_PJBANK}/contadigital/${credencial}/recebimentos/transacoes`,
                                                      headers: {
                                                            'Content-Type': 'application/json'
                                                      },
                                                      data: data
                                                };

                                                axios(config)
                                                      .then(async function (response) {

                                                            let dados = null;
                                                            console.log('teste');
                                                            console.log(response.data);

                                                            if (response.data) {
                                                                  dados = response.data;

                                                                  obj_result.mensagem = "Boletos gerados com sucesso";
                                                                  let contador = 0;
                                                                  obj_result.boleto = [];
                                                                  let cont = 1;

                                                                  if (Array.isArray(response.data)) {

                                                                        response.data.filter(data => data.status != '400').forEach((boleto) => {
                                                                              console.log(boleto)
                                                                              obj_result.boleto.push({ id: cont, link: boleto.linkBoleto });
                                                                              cont++;

                                                                        })

                                                                  } else {
                                                                        obj_result.boleto.push({ id: cont, link: response.data.linkBoleto });
                                                                        cont++;
                                                                  }

                                                                  let n = 1;

                                                                  if (email_req == 1) {
                                                                        let contador = 0;
                                                                        arrays_emails.forEach(ele => {
                                                                              let linkBoleto = obj_result.boleto[contador].link;
                                                                              ele.then(async response => {
                                                                                    await email.enviar_email('sac@sgnsistemas.com.br', response, 'Boletos gerados!', ('Links dos boletos: \n\nSegue o link do seu boleto para pagamento: ' + linkBoleto), transporter);
                                                                              }
                                                                              )
                                                                              contador++;
                                                                        });
                                                                  }


                                                                  if (dados) {
                                                                        console.log(dados);

                                                                        if (Array.isArray(dados)) {
                                                                              dados.forEach(async (dado) => {
                                                                                    querys.atualizaBoletoBanco(dado);
                                                                              });

                                                                        } else {
                                                                              querys.atualizaBoletoBanco(dados);
                                                                              console.log("Não é array");
                                                                        }
                                                                  }

                                                                  obj_result.erro = [];

                                                                  let i = 1;


                                                                  obj_result.boleto.forEach(async (ele, index) => {

                                                                        if(nome_arquivo){

                                                                              download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', nome_arquivo);
                        
                                                                        }else if(tr_codigos){
                        
                                                                              download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', tr_codigos[index]);
                        
                                                                        }else{
                        
                                                                              download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');
                        
                                                                        }
                        
                                                                  });

                                                                  res.json(obj_result);
                                                                  
                                                            } else {
                                                                  //res.json({erro: "Problema na requisição!"});
                                                                  throw next(new Error("Problema na requisição!"));
                                                            }
                                                      })
                                                      .catch(function (error) {
                                                            console.log('entrou nesse catch erro')
                                                            res.json(error.response.data);
                                                            console.log(error.response.data);
                                                      });
                                          } else {
                                                //res.json({erro: "Existem parcelas que já foram emitidas!"});
                                                throw next(new Error("Existem parcelas que já foram emitidas!"));
                                          }
                                    })
                        }

                  } catch (err) {
                        console.log(err);
                        res.json(err);
                  }
            })()

      })()
});


router.get('/boleto', (req, res, next) => {

            let pedido_numero = req.query.pedido;
            let empresa_cod = req.query.empresa;

            (async () => {

                  await sql.connect(config_conexao.sqlConfig);

                  const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

                  if(result_empresa.rowsAffected <= 0){
                        res.json({erro: "Sem dados das credenciais dessa empresa!"});
                        //throw next(new Error("Sem dados das credenciais dessa empresa!"));
                  }

                  let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                  let chave = result_empresa.recordset[0].CPEM_CHAVE;
                  const result_id_unico = await querys.getBoletoCobrancaPjBank(pedido_numero);

                  console.log(result_id_unico);

                  if(result_id_unico.rowsAffected <= 0){

                        res.json({erro: "Não foi encontrado o boleto de cobrança para este número de pedido!"});
                        //throw next(new Error("Não foi encontrado o boleto de cobrança para este número de pedido!"));
                  }

                  let id_unico = result_id_unico.recordset[0].BCPJ_ID_UNICO;

                  operacoes_boletos.consultaPagamentoBoleto(credencial, chave, id_unico)
                  .then(async function (response) {

                        console.log(response.data);
                        res.json(response.data);
                  })
                  .catch(function (error) {
                        console.log(error);
                        res.json(error);
                        //throw next(new Error(error));
                  });

             })()
             .then(resp => console.log("caiu no then",resp))
             .catch(err => console.log("caiu no erro",err));

});

router.get('/boleto/lote', (req, res, next) => {

      let pedido_numero = req.query.pedido.split('-');
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if(result_empresa.rowsAffected <= 0){
                 res.json({erro: "Sem dados das credenciais dessa empresa!"});
                 //throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;
            const dadosCobranca = await querys.getBoletoCobrancaPjBank(pedido_numero);

            console.log(dadosCobranca);

            if(dadosCobranca.rowsAffected <= 0){
                  res.json({erro: "Não foi encontrado o boleto de cobrança para estes números de pedido!"});
                  //throw next(new Error("Não foi encontrado o boleto de cobrança para estes números de pedido!"));
            }

            let numeros_pedidos = dadosCobranca.recordset.map(item => item.BCPJ_PEDIDO_NUMERO);

            operacoes_boletos.impressaoBoletosLote(credencial, chave, numeros_pedidos)
            .then(function (response) {
                  console.log(JSON.stringify(response.data));
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error);
                  res.json(error);
                  //throw next(new Error(error));
            });

      })()
      .then(resp => console.log(resp))
      .catch(err => err);

});

router.get('/boleto/carne', (req, res, next) => {

      let pedido_numero = req.query.pedido.split('-');
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if(result_empresa.rowsAffected <= 0){
                 res.json({erro: "Sem dados das credenciais dessa empresa!"});
                 //throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            const dadosCobranca = await querys.getBoletoCobrancaPjBank(pedido_numero);

            if(dadosCobranca.rowsAffected <= 0){
                  res.json({erro: "Não foi encontrado o boleto de cobrança para estes números de pedido!"});
                  //throw next(new Error("Não foi encontrado o boleto de cobrança para estes números de pedido!"));
            }

            let numeros_pedidos = dadosCobranca.recordset.map(item => item.BCPJ_PEDIDO_NUMERO);

            operacoes_boletos.impressaoBoletosCarne(credencial, chave, pedido_numero)
            .then(function (response) {
                  console.log(JSON.stringify(response.data));
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error);
                  res.json(error);
            });

      })()
      .then(resp => console.log(resp))
      .catch(err => err);

});

router.get('/boleto/filtros', (req, res, next) => {

      let empresa_cod = req.query.empresa;
      let data_inicio = req.query.data_inicio.replaceAll('-', '/');
      let data_fim = req.query.data_fim.replaceAll('-', '/');
      let pagina = 1;
      let pago = req.query.pago;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if(result_empresa.rowsAffected <= 0){
                  res.json({erro: "Sem dados das credenciais dessa empresa!"});
                  //throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

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
      })()
      .then(resp => console.log(resp))
      .catch(err => console.log(err));

});

router.get('/boleto/pagamentos/filtros', (req, res, next) => {

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

            if(result_empresa.rowsAffected <= 0){
                  res.json({erro: "Sem dados das credenciais dessa empresa!"});
                  //throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

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

      })()
      .then(resp => console.log(resp))
      .catch(err => console.log(err));

});

router.delete('/boleto', (req, res, next) => {

      let pedido_numero = req.query.pedido;
      let empresa_cod = req.query.empresa;

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if(result_empresa.rowsAffected <= 0){
                  res.json({erro: "Sem dados das credenciais dessa empresa!"});
                  //throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

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

      })()
      .then(resp => console.log(resp))
      .catch(err => console.log(err));

});

module.exports = router;