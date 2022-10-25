const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser')
const app = express();
app.use(cors('*'));
app.use(bodyParser.json());
var axios = require('axios');
var boletos = require('./http/gerar_boleto')
const nodemailer = require('nodemailer');
const chaves = require('./chaves.json')
const sql = require('mssql');
const datas = require('./src/datas_formatadas');
const smtp = require('./src/smtp/config_smtp');
const email = require('./src/smtp/enviar_email');
const operacoes_boletos = require('./http/gerar_boleto')
 
let dados_boleto = [];
 
let array_parcelas = [];
 
let obj_result = {};
 
app.post('/boleto', (req, res) => {
 
     const transporter = nodemailer.createTransport(smtp.smtp);
 
     let dados_parcela = [];
 
     (async () => {
 
           let codigos = req.body.parcelas;
 
           console.log(codigos)
 
           try {
 
                 await sql.connect(`Server=${chaves.banco_dados.servidor},${chaves.banco_dados.porta};Database=${chaves.banco_dados.banco};User Id=${chaves.banco_dados.usuario};Password=${chaves.banco_dados.senha};Encrypt=false`);
 
                 const dados_cobranca = await sql.query`SELECT
                                                     TRRC_EMPR_COD,
                                                     TRRC_CLIE_COD,
                                                     TRPR_COD,
                                                     TRPR_DTVENC,
                                                     TRPR_VALPREV,
                                                     TRPR_VALJUR,
                                                     TRPR_VALMULTA,
                                                     TRPR_VALDESC,
                                                     CLIE_TIPO_COD
                                               FROM
                                                     TR_PARCELA_RC
                                               INNER JOIN
                                                     TRANSACAO_RC
                                               ON
                                                     TR_PARCELA_RC.TRPR_TRRC_COD = TRANSACAO_RC.TRRC_COD
                                               INNER JOIN
                                                     CLIENTE
                                               ON
                                                     TRANSACAO_RC.TRRC_CLIE_COD = CLIENTE.CLIE_COD
                                               WHERE
                                                     TRPR_COD IN (${codigos})`;
 
                 console.log("Dados da cobrança!")
 
                 console.log(dados_cobranca.recordset[0]);
 
                 let cliente_cod = dados_cobranca.recordset[0].CLIE_TIPO_COD;
                 let empresa_cod = dados_cobranca.recordset[0].TRRC_EMPR_COD;
 
 
                 const result_empresa = await sql.query`SELECT
                                                            CPEM_CREDENCIAL,
                                                            CPEM_URL_WEBHOOK,
                                                            CPEM_URL_LOGO
                                                        FROM
                                                            CREDENCIAL_PJBANK_EMPRESA
                                                        WHERE
                                                            CPEM_EMPR_COD = ${empresa_cod}`;
 
                 console.log(result_empresa.recordset[0].CPEM_CREDENCIAL);
 
                 let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
                 let url_webhook = result_empresa.recordset[0].CPEM_URL_WEBHOOK;
                 let url_logo = result_empresa.recordset[0].CPEM_URL_LOGO;
 
                 const result = await sql.query`SELECT
                                                      TRPR_COD,
                                                      TRPR_DTVENC,
                                                      TRPR_VALPREV,
                                                      TRPR_VALJUR,
                                                      TRPR_VALMULTA,
                                                      TRPR_VALDESC
                                                FROM
                                                      TR_PARCELA_RC
                                                WHERE
                                                      TRPR_COD IN (${codigos})`;

                 console.log(result.recordset);
 
                 const exists_boletos = await sql.query`SELECT
                                                                  BCPJ_COD
                                                            FROM
                                                                  BOLETO_COBRANCA_PJBANK
                                                            WHERE
                                                                  BCPJ_PEDIDO_NUMERO IN (${codigos})`;
                 console.log(exists_boletos);
                 console.log('Numeros de boletos gerados\n');
                 console.log(exists_boletos.rowsAffected[0]);
 
                 dados_parcela = [...dados_cobranca.recordset];
 
                 const result_cliente = await sql.query`SELECT
                                                   CLIE_COD,
                                                   CLIE_NOME,
                                                   PEFI_CPF,
                                                   PEFI_UNFE_SIGLA,
                                                   PEFI_CIDADE,
                                                   PEFI_END,
                                                   PEFI_BAIRRO,
                                                   PEFI_CEP,
                                                   CLIE_TIPO
                                               FROM
                                                   CLIENTE
                                             INNER JOIN
                                                   PESSOA_FISICA
                                             ON
                                                   PEFI_COD = CLIE_TIPO_COD
                                             WHERE
                                                   CLIE_TIPO_COD = ${cliente_cod}
                                            
                                             UNION
                                          
                                             SELECT
                                                   CLIE_COD,
                                                   CLIE_NOME,
                                                   PEJU_CGC,
                                                   PEJU_UNFE_SIGLA_COBR,
                                                   PEJU_CIDADE,
                                                   PEJU_END,
                                                   PEJU_BAIRRO,
                                                   PEJU_CEP_COBR,
                                                   CLIE_TIPO
                                             FROM
                                                   CLIENTE
                                             INNER JOIN
                                                   PESSOA_JURIDICA
                                             ON
                                                   PEJU_COD = CLIE_TIPO_COD
                                             WHERE
                                                   CLIE_TIPO_COD = ${cliente_cod}`;
 
                 console.log(result_cliente);
 
                 let cliente = result_cliente.recordset[0];
 
                 console.log('Quantidade de registros!')
 
                 console.log('Cliente: ' + cliente.CLIE_NOME)
 
                 console.log(result_cliente.recordset.length);
 
                 let nome_cliente;
                 let cpf_cliente;
                 let uf_cliente;
                 let cidade_cliente;
                 let endereco_cliente;
                 let bairro_cliente;
                 let cep_cliente;
 
                 if (result_cliente.recordset.length <= req.body.parcelas.length) {
 
                       if (result_cliente.recordset[0].CLIE_TIPO == 'F') {
 
                             nome_cliente = cliente.CLIE_NOME;
                             pf_cliente = cliente.PEFI_CPF;
                             uf_cliente = cliente.PEFI_UNFE_SIGLA;
                             cidade_cliente = cliente.PEFI_CIDADE;
                             endereco_cliente = cliente.PEFI_END;
                             bairro_cliente = cliente.PEFI_BAIRRO;
                             cep_cliente = cliente.PEFI_CEP;
 
                       } else if (result_cliente.recordset[0].CLIE_TIPO == 'J') {
 
                             nome_cliente = cliente.CLIE_NOME;
                             cpf_cliente = cliente.PEJU_CGC;
                             uf_cliente = cliente.PEJU_UNFE_SIGLA_COBR;
                             cidade_cliente = cliente.PEJU_CIDADE;
                             endereco_cliente = cliente.PEJU_END;
                             bairro_cliente = cliente.PEJU_BAIRRO;
                             cep_cliente = cliente.PEJU_CEP_COBR;
                       }
 
                 } else {
 
                       nome_cliente = cliente.CLIE_NOME;
                       cpf_cliente = cliente.PEFI_CPF;
                       uf_cliente = cliente.PEFI_UNFE_SIGLA;
                       cidade_cliente = cliente.PEFI_CIDADE;
                       endereco_cliente = cliente.PEFI_END;
                       bairro_cliente = cliente.PEFI_BAIRRO;
                       cep_cliente = cliente.PEFI_CEP;
                 }
 
 
                 let data_formatada;
 
                 array_parcelas = dados_parcela.map((parcela) => {
 
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
                             "webhook": url_webhook
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
 
                                   //console.log(JSON.stringify(response.data));
                                   if (response.data) {
 
                                         dados = response.data;
                                         console.log('dados para o banco')
                                         console.log(dados)
 
                                         console.log("data: " + response)
                                         obj_result.mensagem = "Boletos gerados com sucesso";
 
                                         let contador = 0;
                                         obj_result.boleto = [];
                                         let cont = 1;

                                         response.data.forEach((boleto) => {
                                               console.log(boleto)
                                               obj_result.boleto.push({ id: cont, link: boleto.linkBoleto });
                                               cont++;
 
                                         })
 
                                         let n = 1;
 
                                         let links_boletos = obj_result.boleto.reduce((acumulador, atual) => {
 
                                               acumulador += "Boleto " + n + ": " + atual.link + '\n';
                                               n++;
                                               return acumulador;
                                         }, '');
 
                                         console.log(links_boletos);
 
                                         email.enviar_email('sac@sgnsistemas.com.br', 'matheus.pimentel@sgnsistemas.com.br', 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
 
                                         if (dados) {
 
                                               console.log(dados)
 
                                               dados.forEach(async (dado) => {
 
                                                     const result_insert = await sql.query(`INSERT INTO
                                                                         BOLETO_COBRANCA_PJBANK
                                                                                 (
                                                                                    
                                                                                     BCPJ_ID_UNICO,
                                                                                     BCPJ_ID_UNICO_ORIGINAL,
                                                                                     BCPJ_TOKEN_FACILITADOR,
                                                                                     BCPJ_PEDIDO_NUMERO,
                                                                                     BCPJ_LINK_BOLETO,
                                                                                     BCPJ_LINHA_DIGITAVEL,
                                                                                     BCPJ_NOSSO_NUMERO
                                                                                 )
                                                                         VALUES(
                                                                                    
                                                                                     '${dado.id_unico}',
                                                                                     '${dado.id_unico_original}',
                                                                                     '${dado.token_facilitador}',
                                                                                     '${dado.pedido_numero}',
                                                                                     '${dado.linkBoleto}',
                                                                                     '${dado.linhaDigitavel}',
                                                                                     '${dado.nossonumero}'
                                                                            
                                                                               )`);
 
 
                                                     console.log('Consulta pagamento boleto!');
 
                                                     console.log(dado.id_unico);
 
                                                     boletos.consultaPagamentoBoleto(dado.id_unico)
                                                           .then(async function (response) {
 
                                                                 console.log(response.dataclear);
                                                                 let status = response.data[0].registro_sistema_bancario;
 
                                                                 const result_update = await sql.query(`UPDATE
                                                                                                                  BOLETO_COBRANCA_PJBANK
                                                                                                        SET
                                                                                                                  BCPJ_STATUS = '${status}'
                                                                                                        WHERE
                                                                                                                  BCPJ_ID_UNICO = '${dado.id_unico}'`);
                                                           })
                                                           .catch(function (error) {
                                                                 console.log(error);
                                                           });
 
                                               })
 
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
 
});

app.get('/boleto', (req, res) => {

      let pedido_numero = req.query.pedido;
      let empresa_cod = req.query.empresa;
      console.log('aqui')
      console.log(pedido_numero);
      console.log(empresa_cod);

      (async () => {

            await sql.connect(`Server=${chaves.banco_dados.servidor},${chaves.banco_dados.porta};Database=${chaves.banco_dados.banco};User Id=${chaves.banco_dados.usuario};Password=${chaves.banco_dados.senha};Encrypt=false`);

            const result_empresa = await sql.query`SELECT
                                                            CPEM_CREDENCIAL,
                                                            CPEM_URL_WEBHOOK,
                                                            CPEM_URL_LOGO,
                                                            CPEM_CHAVE
                                                      FROM
                                                            CREDENCIAL_PJBANK_EMPRESA
                                                      WHERE
                                                            CPEM_EMPR_COD = ${empresa_cod}`;

            console.log(result_empresa.recordset[0].CPEM_CREDENCIAL);

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let url_webhook = result_empresa.recordset[0].CPEM_URL_WEBHOOK;
            let url_logo = result_empresa.recordset[0].CPEM_URL_LOGO;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            const result_id_unico = await sql.query`SELECT
                                                            BCPJ_ID_UNICO
                                                   FROM
                                                            BOLETO_COBRANCA_PJBANK
                                                   WHERE
                                                            BCPJ_PEDIDO_NUMERO = (${pedido_numero})`;

            let id_unico = result_id_unico.recordset[0].BCPJ_ID_UNICO;

            console.log(id_unico);

            operacoes_boletos.consultaPagamentoBoleto(credencial, chave, id_unico)
            .then(async function (response) {
          
                  console.log(response.data);
                  res.json(response.data);
            })
            .catch(function (error) {
                  console.log(error);
                  res.json(error);
            })

      })();

});

app.delete('/boleto', (req, res) => {

      let pedido_numero = req.query.pedido;
      let empresa_cod = req.query.empresa;

      console.log('entrei no delete');

      (async () => {

            await sql.connect(`Server=${chaves.banco_dados.servidor},${chaves.banco_dados.porta};Database=${chaves.banco_dados.banco};User Id=${chaves.banco_dados.usuario};Password=${chaves.banco_dados.senha};Encrypt=false`);

            const result_empresa = await sql.query`SELECT
                                                            CPEM_CREDENCIAL,
                                                            CPEM_URL_WEBHOOK,
                                                            CPEM_URL_LOGO,
                                                            CPEM_CHAVE
                                                      FROM
                                                            CREDENCIAL_PJBANK_EMPRESA
                                                      WHERE
                                                            CPEM_EMPR_COD = ${empresa_cod}`;

            console.log(result_empresa.recordset[0].CPEM_CREDENCIAL);

            let credencial = result_empresa.recordset[0].CPEM_CREDENCIAL;
            let url_webhook = result_empresa.recordset[0].CPEM_URL_WEBHOOK;
            let url_logo = result_empresa.recordset[0].CPEM_URL_LOGO;
            let chave = result_empresa.recordset[0].CPEM_CHAVE;

            const result_id_unico = await sql.query`SELECT
                                                            BCPJ_ID_UNICO
                                                   FROM
                                                            BOLETO_COBRANCA_PJBANK
                                                   WHERE
                                                            BCPJ_PEDIDO_NUMERO = ${pedido_numero}`;

            let id_unico = result_id_unico.recordset[0].BCPJ_ID_UNICO;

            console.log(id_unico);

            operacoes_boletos.invalidarBoleto(credencial, chave, id_unico)
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
 
app.listen(7000, () => {
 
     console.log("Servidor rodando na porta 7000...");
})

