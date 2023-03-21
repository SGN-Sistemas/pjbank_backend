const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');
const sql = require('mssql');
require('dotenv/config');
const download = require('../utils/dowload');
const CircularJSON = require('circular-json');

const datas = require('../../src/datas_formatadas');
const smtp = require('../../src/smtp/config_smtp');
const email = require('../../src/smtp/enviar_email');
const operacoes_boletos = require('../../http/gerar_boleto');
const config_conexao = require('../db/config_conexao');
const querys = require('../query/index');
const utilitarios = require('../utilitarios/verificaExisteEmpresaIgual');
const download_pdf = require('../utilitarios/download_pdf.js');
const { json } = require('body-parser');
// cd route

const { route } = require('./contaRecebimento');
const { query } = require('express');

const router = express.Router();

let array_parcelas;

let obj_result = {};

let credencial;
let email_cliente;

router.post('/boleto_recebimento', (req, res, next) => {

      let codigos = req.body.parcelas;
      let email_req = req.body.email;
      let tr = req.body.tr;
      let nome_arquivo = req.body.nome_arq;
      let cobr_cod = req.body.cobr_cod;

      console.log('nomeArq');

      console.log(nome_arquivo);

      console.log('codigos')

      console.log(codigos)

      console.log('cobr_cod')

      console.log(cobr_cod)

      let tr_codigos = tr == 1 ? codigos : '';

      console.log('array de trs')
      console.log(tr_codigos)

      // Boleto, pix ou Pix e Boleto
      let forma_pagamento = 'pix-e-boleto';

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

                        console.log(dados_cobranca);

                        let igual = utilitarios.verificaExisteClienteIgual(dados_cobranca.recordset);

                        if (igual) {

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              console.log(cliente_cod);
                              console.log(empresa_cod);

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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
                                          "juros_fixo": parcela.TRPR_VALJUR,
                                          "multa": parcela.TRPR_VALMULTA,
                                          "multa_fixo": parcela.TRPR_VALMULTA,
                                          "nome_cliente": nome_cliente,
                                          "email_cliente": email_cliente,
                                          "telefone_cliente": telefone_cliente,
                                          "cpf_cliente": cpf_cliente,
                                          "endereco_cliente": endereco_cliente,
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente,
                                          "cidade_cliente": cidade_cliente,
                                          "estado_cliente": uf_cliente,
                                          "cep_cliente": cep_cliente,
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "webhook": url_webhook,
                                          "pedido_numero": parcela.TRPR_COD,
                                          "especie_documento": "DS",
                                          "pix": forma_pagamento

                                    }

                                    console.log(obj);

                                    return obj;
                              });

                              console.log("Depois do map");

                              if(exists_boletos.rowsAffected[0] > 0){
                                    //res.json({erro: "Existem parcelas que já foram emitidas!"});
                                    throw next(new Error("Existem parcelas que já foram emitidas!"));
                              }

                              // var data = JSON.stringify({
                              //       "cobrancas": [...array_parcelas]
                              // })

                              var data = CircularJSON.stringify({
                                     "cobrancas": [...array_parcelas]
                              });

                              console.log(data);

                              var config = {
                                    method: 'post',
                                    url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
                                    headers: {
                                          'Content-Type': 'application/json'
                                    },
                                    data: data
                              };

                              console.log(process.env.PRE_URL_PJBANK);

                              console.log(config);

                              axios(config)
                                    .then(async function (response) {

                                        console.log(response);

                                          let dados = null;
                                          console.log('teste');
                                          console.log(response.data);

                                          if(!response.data){
                                                //res.json({erro: "Problema na requisição!"});
                                                throw next(new Error("Problema na requisição!"));
                                          }

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

                                                });

                                          }else {

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

                                          if (email_req == 1) {
                                                email.enviar_email('sac@sgnsistemas.com.br', email_cliente, 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
                                          }


                                          if(!dados){
                                                console.log("Não entrou no if de dados");
                                          }

                                          console.log(dados);

                                          if (Array.isArray(dados)) {

                                                dados.forEach(async (dado) => {
                                                      querys.atualizaBoletoBanco(dado);
                                                });

                                          }else {

                                                querys.atualizaBoletoBanco(dados);
                                                console.log("Não é array");
                                          }

                                          obj_result.erro = [];

                                          obj_result.boleto.forEach(async (ele, index) => {

                                                // /home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads
                                                // /www/downloads

                                                if(nome_arquivo){

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', nome_arquivo);

                                                }else if(tr_codigos){

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', tr_codigos[index]);

                                                }else{

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', '');

                                                }

                                          });

                                          res.json(obj_result);

                                    })
                                    .catch(function (error) {
                                          console.log('entrou no catch');
                                          res.json(error.response.data);
                                          console.log(error.response.data);
                                    });

                        } else {

                              console.log("Clientes diferentes");

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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
                                          "juros_fixo": parcela.TRPR_VALJUR ? parcela.TRPR_VALJUR : "",
                                          "multa": parcela.TRPR_VALMULTA ? parcela.TRPR_VALMULTA : "",
                                          "multa_fixo": parcela.TRPR_VALMULTA ? parcela.TRPR_VALMULTA : "",
                                          "nome_cliente": nome_cliente ? nome_cliente : "",
                                          "email_cliente": email_cliente ? email_cliente : "",
                                          "telefone_cliente": telefone_cliente ? telefone_cliente : "",
                                          "cpf_cliente": cpf_cliente ? cpf_cliente : "",
                                          "endereco_cliente": endereco_cliente ? endereco_cliente : "",
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente ? bairro_cliente : "",
                                          "cidade_cliente": cidade_cliente ? cidade_cliente : "",
                                          "estado_cliente": uf_cliente ? uf_cliente : "",
                                          "cep_cliente": cep_cliente ? cep_cliente : "",
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS ? parcela.TRPR_OBS : "",
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "webhook": url_webhook ? url_webhook : "",
                                          "pedido_numero": parcela.TRPR_COD ? parcela.TRPR_COD : "",
                                          "especie_documento": "DS",
                                          "pix": forma_pagamento
                                          
                                    }
                                    return obj;
                              });

                              let array_result = [];

                              Promise.all([...array_parcelas])
                                    .then(response => {

                                          console.log(response)

                                          if (exists_boletos.rowsAffected[0] <= 0) {

                                                var data = CircularJSON.stringify({
                                                      "cobrancas": response
                                                });

                                                var config = {
                                                      method: 'post',
                                                      url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
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

                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', nome_arquivo);
                        
                                                                        }else if(tr_codigos){
                        
                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', tr_codigos[index]);
                        
                                                                        }else{
                        
                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', '');
                        
                                                                        }

                                                                  });

                                                                  res.json(obj_result);
                                                            } else {
                                                                  //res.json({erro: "Problema na requisição!"});
                                                                  throw next(new Error("Problema na requisição!"));
                                                            }

                                                      })
                                                      .catch(function (error) {
                                                            // res.json(error);
                                                            // console.log(error);
                                                            console.log('entrou no catch');
                                                            res.json(error.response.data);
                                                            console.log(error.response.data);
                                                      });
                                          } else {
                                                //res.json({erro: "Existem parcelas que já foram emitidas!"})
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

router.post('/boleto_recebimento/carne', (req, res, next) => {

      let pedido_numero = req.query.pedido.split('-');
      let empresa_cod = req.query.empresa;
      let cobr_cod    = req.query.cobr_cod;

      //console.log('teste')

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);

            if(result_empresa.rowsAffected <= 0){
                  //res.json({erro: "Sem dados das credenciais dessa empresa!"});
                  throw next(new Error("Sem dados das credenciais dessa empresa!"));
            }

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;
            const result_id_unico = await querys.getBoletoCobrancaPjBank(pedido_numero);

            console.log(result_id_unico);

            if(result_id_unico.rowsAffected <= 0){
                  //res.json({erro: "Não foi encontrado o boleto de cobrança para este número de pedido!"});
                  throw next(new Error("Não foi encontrado o boleto de cobrança para este número de pedido!"));     
            }

            let id_unico = result_id_unico.recordset[0].BCPJ_ID_UNICO;

            operacoes_boletos.impressaoBoletosCarneSemContaDigital(credencial, chave, pedido_numero)
            .then(async function (response) {

                  console.log(response.data);
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error.response.data);
                  res.json(error.response.data);
            });

       })()
       .then(resp => console.log("caiu no then",resp))
       .catch(err => console.log("caiu no erro",err));

});


router.post('/boleto_recebimento/lote', (req, res, next) => {

    let pedido_numero = req.query.pedido.split('-');
    let empresa_cod = req.query.empresa;
    let cobr_cod    = req.query.cobr_cod;

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod, cobr_cod);

          if(result_empresa.rowsAffected <= 0){
            res.json({"erro":"Sem dados das credenciais dessa empresa!"});
          }

          let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
          let chave = result_empresa.recordset[0].CPEM_CHAVE;
          const dadosCobranca = await querys.getBoletoCobrancaPjBank(pedido_numero);

          console.log(dadosCobranca);

          if(dadosCobranca.rowsAffected <= 0){
                res.json({"erro": "Não foi encontrado o boleto de cobrança para estes números de pedido!"});
          }

          let numeros_pedidos = dadosCobranca.recordset.map(item => item.BCPJ_PEDIDO_NUMERO);

          operacoes_boletos.impressaoBoletosLoteSemContaDigital(credencial, chave, numeros_pedidos)
          .then(function (response) {
                console.log(JSON.stringify(response.data));
                res.json(response.data);
          })
          .catch(function (error) {
                console.log(error.response.data);
                res.json(error.response.data);
          });

    })()
    .then(resp => console.log(resp))
    .catch(err => err);

});

router.delete('/boleto_recebimento', (req, res, next) => {

    let pedido_numero = req.query.pedido;
    let empresa_cod = req.query.empresa;
    let cobr_cod    = req.query.cobr_cod;

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);

          if(result_empresa.rowsAffected <= 0){
                res.json({erro: "Sem dados das credenciais dessa empresa!"});
          }

          let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
          let chave = result_empresa.recordset[0].CPEM_CHAVE;

          operacoes_boletos.invalidarBoletoSemContaVirtual(credencial, chave, pedido_numero)
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

router.get('/boleto_recebimento/consulta_boletos', (req, res, next) => {

      let empresa_cod = req.query.empresa;
      let cobr_cod = req.body.cobr_cod;
      let dados = req.body;
      

      console.log('Exibiçção dos dados: ');
      console.log(dados);

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);

            if(result_empresa.rowsAffected <= 0){
                  res.json({erro: "Sem dados das credenciais dessa empresa!"});
            }

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            operacoes_boletos.consultarBoletosRecebimentoSemContaDigital(credencial, chave, dados)
            .then(async function (response) {

                  console.log(response.data);
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error);
                  res.json(error);
            });

       })()
       .then(resp => console.log("caiu no then",resp))
       .catch(err => console.log("caiu no erro",err));

});

router.get('/boleto_recebimento/consulta_boletos/identificador/', (req, res, next) => {

      let empresa_cod = req.query.empresa;
      let pedido_numero = req.query.identificador;
      let cobr_cod = req.query.cobr_cod;

      console.log('Exibiçção dos dados: ');
      console.log(pedido_numero);

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

            if(result_empresa.rowsAffected <= 0){
                  res.json({erro: "Sem dados das credenciais dessa empresa!"});
            }

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            operacoes_boletos.consultarBoletosRecebimentoSemContaDigital(credencial, chave, dados)
            .then(async function (response) {

                  console.log(response.data);
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error);
                  res.json(error);
            });

       })()
       .then(resp => console.log("caiu no then",resp))
       .catch(err => console.log("caiu no erro",err));array_par
       dados_split
});

router.post('/boleto_recebimento/split', (req, res, next) => {

      // ----------------------------------------------------------------------------------------

      let split_dest = [
            {
                  "nome": "Fornecedor 1",
                  "cnpj": "45510143000181",
                  "banco_repasse": "003",
                  "agencia_repasse": "0001",
                  "conta_repasse": "99999-9",
                  "valor_fixo": 100,
                  "porcentagem_encargos": 10
            },
            {
                  "nome": "Fornecedor 2",
                  "cnpj": "72025834000162",
                  "banco_repasse": "003",
                  "agencia_repasse": "0002",
                  "conta_repasse": "99999-7",
                  "valor_fixo": 86,
                  "porcentagem_encargos": 05
            }
      ];

      let array_split_dest = [];

      console.log('teste');

      let codigos = req.body.parcelas;
      let email_req = req.body.email;
      let split = req.body.split;
      let tr = req.body.tr;
      let nome_arq = req.body.nome_arq;
      let cobr_cod = req.body.cobr_cod;

      // ----------------------------------------------------------------------------------------
      // let split_dest = [];

      // codigos.forEach(async parc => {

      //       let dados_split = await querys.getDadosContaSplit(parc);

      //       if(dados_split.rowsAffected > 0){

      //                   dados_split.recordset.forEach(par => {

      //                         let conta_obj = {

      //                               nome: par.nome,
      //                               cnpj: par.cnpj,
      //                               banco_repasse: par.banco_repasse,
      //                               agencia_repasse: par.agencia_repasse,
      //                               conta_repasse: par.conta_repasse,
      //                               valor_fixo: par.valor_fixo,
      //                               porcentagem_encargos: par.percent_encargos
                              
      //                         }
      
      //                         console.log('dados do split');
      
      //                         console.log(conta_obj);
      
      //                         split_dest.push(conta_obj);
      
      //                         console.log(split_dest);
 
      //                   });

      //                   array_split_dest.push(split_dest);

      //       } 
      // })   

      console.log('Dados split - Aqui');

      console.log('--------------------------------------------------------------');

      console.log(split_dest);

      console.log('--------------------------------------------------------------');

      console.log('nomeArq');

      console.log(nome_arq);

      console.log('codigos');

      console.log(codigos);

      console.log('cobr_cod');

      console.log(cobr_cod);

      let tr_codigos = tr == 1 ? codigos : '';

      console.log('array de trs');
      console.log(tr_codigos);

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

                        console.log(dados_cobranca);

                        let igual = utilitarios.verificaExisteClienteIgual(dados_cobranca.recordset);

                        if (igual) {

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              console.log(cliente_cod);
                              console.log(empresa_cod);

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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
                                          "desconto": 0,
                                          "nome_cliente": nome_cliente,
                                          "cpf_cliente": cpf_cliente,
                                          "endereco_cliente": endereco_cliente,
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente,
                                          "cidade_cliente": cidade_cliente,
                                          "estado_cliente": uf_cliente,
                                          "cep_cliente": cep_cliente,
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "split": split_dest,
                                          "webhook": url_webhook,
                                          "pedido_numero": parcela.TRPR_COD,
                                          "especie_documento": "DS",
                                          "pix": 'pix-e-boleto'

                                    }

                                    console.log(obj);

                                    return obj;
                              });

                              console.log('Array parcelas');

                              console.log('--------------------------------------------------------------');

                              console.log(array_parcelas);

                              // let par = array_parcelas.map(ele => {
                              //       console.log(ele);
                              //       return ele;
                              // })

                              console.log('--------------------------------------------------------------');

                              console.log("Depois do map");

                              if(exists_boletos.rowsAffected > 0){
                                    //res.json({erro: "Existem parcelas que já foram emitidas!"});
                                    throw next(new Error("Existem parcelas que já foram emitidas!"));
                              }

                              var data = CircularJSON.stringify({
                                    "cobrancas": [...array_parcelas]
                              });

                              // var data = CircularJSON.stringify(array_parcelas[0]);

                              var config = {
                                    method: 'post',
                                    maxBodyLength: Infinity,
                                    url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
                                    headers: {
                                          'Content-Type': 'application/json'
                                    },
                                    data: data
                              };

                              console.log(process.env.PRE_URL_PJBANK);

                              console.log(config);

                              console.log('pre requisicao')

                              axios(config)
                                    .then(function (response) {

                                        console.log(response);

                                          let dados = null;
                                          console.log('teste');
                                          console.log(response.data);

                                          if(!response.data){
                                                //res.json({erro: "Problema na requisição!"});
                                                throw next(new Error("Problema na requisição!"));
                                          }

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

                                                });

                                          }else {

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

                                          if (email_req == 1) {
                                                email.enviar_email('sac@sgnsistemas.com.br', email_cliente, 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
                                          }


                                          if(!dados){
                                                console.log("Não entrou no if de dados");
                                          }

                                          console.log(dados);

                                          if (Array.isArray(dados)) {

                                                dados.forEach(async (dado) => {
                                                      querys.atualizaBoletoBanco(dado);
                                                });

                                          }else {

                                                querys.atualizaBoletoBanco(dados);
                                                console.log("Não é array");
                                          }

                                          obj_result.erro = [];

                                          // let caminho_arquivo = await query.getCaminhoArquivoCobranca(cobr_cod);
                                          // caminho_arquivo = ( caminho_arquivo.rowsAffected ) > 0 ? caminho_arquivo.recordset[0].COBR_DIR_GERACAO : '/www/downloads';

                                          console.log('Caminho arquivo');
                                          console.log(caminho_arquivo);

                                          let caminho_arquivo = '/www/downloads';

                                          obj_result.boleto.forEach(async (ele, index) => {

                                                if(nome_arq){

                                                      download_pdf.downloadPdf(ele.link, caminho_arquivo, nome_arq);

                                                }else if(tr_codigos){

                                                      download_pdf.downloadPdf(ele.link, caminho_arquivo, tr_codigos[index]);

                                                }else{
                                                      download_pdf.downloadPdf(ele.link, caminho_arquivo, '');

                                                }

                                          });

                                          res.json(obj_result);

                                    })
                                    .catch(function (error) {
                                          console.log('entrou no catch');
                                          res.json(error.response);
                                          console.log(error.response);
                                    });

                        } else {

                              console.log("Clientes diferentes");

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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

                                          "vencimento": data_formatada,
                                          "valor": parcela.TRPR_VALPREV,
                                          "juros": parcela.TRPR_VALJUR,
                                          "multa": parcela.TRPR_VALMULTA,
                                          "desconto": 0,
                                          "nome_cliente": nome_cliente,
                                          "cpf_cliente": cpf_cliente,
                                          "endereco_cliente": endereco_cliente,
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente,
                                          "cidade_cliente": cidade_cliente,
                                          "estado_cliente": uf_cliente,
                                          "cep_cliente": cep_cliente,
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "split": split_dest,
                                          "webhook": url_webhook,
                                          "pedido_numero": parcela.TRPR_COD,
                                          "especie_documento": "DS",
                                          "pix": 'pix-e-boleto'

                                    }
                                    return obj;
                              });

                              let array_result = [];

                              Promise.all([...array_parcelas])
                                    .then(response => {

                                          console.log(response)

                                          if (exists_boletos.rowsAffected <= 0) {

                                                var data = CircularJSON.stringify({
                                                      "cobrancas": response
                                                });

                                                var config = {
                                                      method: 'post',
                                                      url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
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

                                                            if (response.data){
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

                                                                  //let caminho_arquivo = await query.getCaminhoArquivoCobranca(cobr_cod);

                                                                  let caminho_arquivo = await query.getCaminhoArquivoCobranca(cobr_cod);
                                                                  caminho_arquivo = caminho_arquivo.rowsAffected > 0 ? caminho_arquivo.recordset[0].COBR_DIR_GERACAO : '/www/downloads';

                                                                  //let caminho_arquivo = '/www/downloads';

                                                                  console.log('Caminho arquivo');

                                                                  console.log(caminho_arquivo);

                                                                  obj_result.boleto.forEach(async (ele) => {

                                                                        if(nome_arq){

                                                                              download_pdf.downloadPdf(ele.link, caminho_arquivo, nome_arq);
                        
                                                                        }else if(tr_codigos){
                        
                                                                              download_pdf.downloadPdf(ele.link, caminho_arquivo, tr_codigos[index]);
                        
                                                                        }else{
                        
                                                                              download_pdf.downloadPdf(ele.link, caminho_arquivo, '');
                        
                                                                        }

                                                                  });

                                                                  res.json(obj_result);

                                                            } else {
                                                                  //res.json({erro: "Problema na requisição!"});
                                                                  throw next(new Error("Problema na requisição!"));
                                                            }

                                                      })
                                                      .catch(function (error) {
                                                            // res.json(error);
                                                            // console.log(error);
                                                            console.log('entrou no catch');
                                                            res.json(error.response.data);
                                                            console.log(error.response.data);
                                                      });
                                          } else {
                                                //res.json({erro: "Existem parcelas que já foram emitidas!"})
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

router.put('/boleto_recebimento', (req, res, next) => {

      let codigos = req.body.parcelas;
      let email_req = req.body.email;
      let tr = req.body.tr;
      let nome_arq = req.body.nome_arq;
      let cobr_cod = req.body.cobr_cod;

      console.log('nomeArq');

      console.log(nome_arq);

      console.log('codigos')

      console.log(codigos)

      let tr_codigos = tr == 1 ? codigos : '';

      let nome_arquivo = nome_arq ? nome_arq : '';

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

                        console.log(dados_cobranca);

                        let igual = utilitarios.verificaExisteClienteIgual(dados_cobranca.recordset);

                        if (igual) {

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              console.log(cliente_cod);
                              console.log(empresa_cod);

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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
                                          "juros_fixo": parcela.TRPR_VALJUR,
                                          "multa": parcela.TRPR_VALMULTA,
                                          "multa_fixo": parcela.TRPR_VALMULTA,
                                          "nome_cliente": nome_cliente,
                                          "email_cliente": email_cliente,
                                          "telefone_cliente": telefone_cliente,
                                          "cpf_cliente": cpf_cliente,
                                          "endereco_cliente": endereco_cliente,
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente,
                                          "cidade_cliente": cidade_cliente,
                                          "estado_cliente": uf_cliente,
                                          "cep_cliente": cep_cliente,
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS,
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "webhook": url_webhook,
                                          "pedido_numero": parcela.TRPR_COD,
                                          "especie_documento": "DS",
                                          "pix": forma_pagamento

                                    }

                                    console.log(obj);

                                    return obj;
                              });

                              console.log("Depois do map");

                              // if(exists_boletos.rowsAffected[0] > 0){
                              //       //res.json({erro: "Existem parcelas que já foram emitidas!"});
                              //       throw next(new Error("Existem parcelas que já foram emitidas!"));
                              // }

                              // var data = JSON.stringify({
                              //       "cobrancas": [...array_parcelas]
                              // });

                              var data = CircularJSON.stringify({
                                    "cobrancas": [...array_parcelas]
                              });

                              console.log(data);

                              var config = {
                                    method: 'post',
                                    url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
                                    headers: {
                                          'Content-Type': 'application/json'
                                    },
                                    data: data
                              };

                              console.log(process.env.PRE_URL_PJBANK);

                              console.log(config);

                              axios(config)
                                    .then(async function (response) {

                                        console.log(response);

                                          let dados = null;
                                          console.log('teste');
                                          console.log(response.data);

                                          if(!response.data){
                                                //res.json({erro: "Problema na requisição!"});
                                                throw next(new Error("Problema na requisição!"));
                                          }

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

                                                });

                                          }else {

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

                                          if (email_req == 1) {
                                                email.enviar_email('sac@sgnsistemas.com.br', email_cliente, 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
                                          }


                                          if(!dados){
                                                console.log("Não entrou no if de dados");
                                          }

                                          console.log(dados);

                                          if (Array.isArray(dados)) {

                                                dados.forEach(async (dado) => {
                                                      querys.atualizaBoletoBanco(dado);
                                                });

                                          }else {

                                                querys.atualizaBoletoBanco(dados);
                                                console.log("Não é array");
                                          }

                                          obj_result.erro = [];

                                          obj_result.boleto.forEach(async (ele) => {

                                                if(nome_arquivo){

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', nome_arquivo);

                                                }else if(tr_codigos){

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', tr_codigos[index]);

                                                }else{

                                                      download_pdf.downloadPdf(ele.link, '/www/downloads', '');

                                                }

                                          });

                                          res.json(obj_result);

                                    })
                                    .catch(function (error) {
                                          console.log('entrou no catch');
                                          res.json(error.response.data);
                                          console.log(error.response.data);
                                    });

                        } else {

                              console.log("Clientes diferentes");

                              let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                              let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;

                              const result_empresa = await querys.selectCredencialEmpresaSemContaDigital(empresa_cod, cobr_cod);
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
                                          "juros_fixo": parcela.TRPR_VALJUR ? parcela.TRPR_VALJUR : "",
                                          "multa": parcela.TRPR_VALMULTA ? parcela.TRPR_VALMULTA : "",
                                          "multa_fixo": parcela.TRPR_VALMULTA ? parcela.TRPR_VALMULTA : "",
                                          "nome_cliente": nome_cliente ? nome_cliente : "",
                                          "email_cliente": email_cliente ? email_cliente : "",
                                          "telefone_cliente": telefone_cliente ? telefone_cliente : "",
                                          "cpf_cliente": cpf_cliente ? cpf_cliente : "",
                                          "endereco_cliente": endereco_cliente ? endereco_cliente : "",
                                          "numero_cliente": "509",
                                          "bairro_cliente": bairro_cliente ? bairro_cliente : "",
                                          "cidade_cliente": cidade_cliente ? cidade_cliente : "",
                                          "estado_cliente": uf_cliente ? uf_cliente : "",
                                          "cep_cliente": cep_cliente ? cep_cliente : "",
                                          "logo_url": (url_logo) ? url_logo : "",
                                          "texto": parcela.TRPR_OBS ? parcela.TRPR_OBS : "",
                                          "instrucoes": "Este é um boleto de exemplo",
                                          "instrucao_adicional": "\n- Este boleto não deve ser pago pois é um exemplo",
                                          "grupo": "Boletos",
                                          "webhook": url_webhook ? url_webhook : "",
                                          "pedido_numero": parcela.TRPR_COD ? parcela.TRPR_COD : "",
                                          "especie_documento": "DS",
                                          "pix": forma_pagamento
                                          
                                    }
                                    return obj;
                              });

                              let array_result = [];

                              Promise.all([...array_parcelas])
                                    .then(response => {

                                          console.log(response)

                                          // if (exists_boletos.rowsAffected[0] <= 0) {

                                                var data = JSON.stringify({
                                                      "cobrancas": response
                                                });

                                                var config = {
                                                      method: 'post',
                                                      url: `${process.env.PRE_URL_PJBANK}/recebimentos/${credencial}/transacoes`,
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


                                                                  obj_result.boleto.forEach(async (ele) => {

                                                                        if(nome_arquivo){

                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', nome_arquivo);
                        
                                                                        }else if(tr_codigos){
                        
                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', tr_codigos[index]);
                        
                                                                        }else{
                        
                                                                              download_pdf.downloadPdf(ele.link, '/www/downloads', '');
                        
                                                                        }

                                                                  });

                                                                  res.json(obj_result);
                                                            } else {
                                                                  //res.json({erro: "Problema na requisição!"});
                                                                  throw next(new Error("Problema na requisição!"));
                                                            }

                                                      })
                                                      .catch(function (error) {
                                                            // res.json(error);
                                                            // console.log(error);
                                                            console.log('entrou no catch');
                                                            res.json(error.response.data);
                                                            console.log(error.response.data);
                                                      });

                                          // } else {
                                          //       //res.json({erro: "Existem parcelas que já foram emitidas!"})
                                          //       throw next(new Error("Existem parcelas que já foram emitidas!"));
                                          // }
                                    })
                        }

                  }catch (err) {
                        console.log(err);
                        res.json(err);
                  }
            })()

      })()
});

module.exports = router;