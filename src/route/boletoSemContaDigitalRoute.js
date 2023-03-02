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
// cd route

const { route } = require('./contaRecebimento');

const router = express.Router();

let array_parcelas;

let obj_result = {};

let credencial;
let email_cliente;

router.post('/boleto_recebimento', (req, res, next) => {

      let codigos = req.body.parcelas;
      let email_req = req.body.email;

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

                              var data = JSON.stringify({
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

                                                download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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

                                                                        download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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

      //console.log('teste')

      (async () => {

            await sql.connect(config_conexao.sqlConfig);

            const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

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

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

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

    (async () => {

          await sql.connect(config_conexao.sqlConfig);

          const result_empresa = await querys.selectCredencialEmpresa(empresa_cod);

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
      let dados = req.body;

      console.log('Exibiçção dos dados: ');
      console.log(dados);

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
       .catch(err => console.log("caiu no erro",err));

});

router.post('/boleto_recebimento/split', (req, res, next) => {

      let split_dest = [
            {
                  "nome": "Fornecedor 1",
                  "cnpj": "10488175000143",
                  "banco_repasse": "003",
                  "agencia_repasse": "0001",
                  "conta_repasse": "99999-9",
                  "valor_fixo": 100,
                  "porcentagem_encargos": 10
            },
            {
                  "nome": "Fornecedor 2",
                  "cnpj": "25377167000105",
                  "banco_repasse": "003",
                  "agencia_repasse": "0002",
                  "conta_repasse": "99999-7",
                  "valor_fixo": 86,
                  "porcentagem_encargos": 05
            }
      ];

      let codigos = req.body.parcelas;
      let email_req = req.body.email;
      let split = req.body.split ?? split_dest;

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

                              console.log("Depois do map");

                              if(exists_boletos.rowsAffected[0] > 0){
                                    //res.json({erro: "Existem parcelas que já foram emitidas!"});
                                    throw next(new Error("Existem parcelas que já foram emitidas!"));
                              }

                              var data = JSON.stringify({
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

                                                download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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

                                          if (exists_boletos.rowsAffected[0] <= 0) {

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

                                                                        download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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

                              var data = JSON.stringify({
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

                                                download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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

                                                                        download_pdf.downloadPdf(ele.link, '/home/matheus/Matheus - Projetos PJbank/Backend-pjbank/pjbank_backend/downloads', '');

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