// var axios = require('axios');
// const email = require('../src/smtp/enviar_email');
// const sql = require('mssql');
// var boletos = require('../http/gerar_boleto');

// function gerarBoletosRequisicao(config, obj_result, transporter){

//     axios(config)
//                              .then(async function (response) {
 
//                                    let dados = null;

//                                    if (response.data) {
 
//                                          dados = response.data;
 
//                                          obj_result.mensagem = "Boletos gerados com sucesso";
 
//                                          let contador = 0;
//                                          obj_result.boleto = [];
//                                          let cont = 1;

//                                          response.data.forEach((boleto) => {
//                                                console.log(boleto)
//                                                obj_result.boleto.push({ id: cont, link: boleto.linkBoleto });
//                                                cont++;
//                                          })
 
//                                          let n = 1;
 
//                                          let links_boletos = obj_result.boleto.reduce((acumulador, atual) => {
 
//                                                acumulador += "Boleto " + n + ": " + atual.link + '\n';
//                                                n++;
//                                                return acumulador;
//                                          }, '');
 
//                                          console.log(links_boletos);
 
//                                          email.enviar_email('sac@sgnsistemas.com.br', 'matheus.pimentel@sgnsistemas.com.br', 'Boletos gerados!', ('Links dos boletos: \n\n' + links_boletos), transporter);
 
//                                          if (dados) {
 
//                                                console.log(dados)
 
//                                                dados.forEach(async (dado) => {
 
//                                                      const result_insert = await sql.query(`INSERT INTO
//                                                                          BOLETO_COBRANCA_PJBANK
//                                                                                  (
                                                                                    
//                                                                                      BCPJ_ID_UNICO,
//                                                                                      BCPJ_ID_UNICO_ORIGINAL,
//                                                                                      BCPJ_TOKEN_FACILITADOR,
//                                                                                      BCPJ_PEDIDO_NUMERO,
//                                                                                      BCPJ_LINK_BOLETO,
//                                                                                      BCPJ_LINHA_DIGITAVEL,
//                                                                                      BCPJ_NOSSO_NUMERO
//                                                                                  )
//                                                                          VALUES(
                                                                                    
//                                                                                      '${dado.id_unico}',
//                                                                                      '${dado.id_unico_original}',
//                                                                                      '${dado.token_facilitador}',
//                                                                                      '${dado.pedido_numero}',
//                                                                                      '${dado.linkBoleto}',
//                                                                                      '${dado.linhaDigitavel}',
//                                                                                      '${dado.nossonumero}'
                                                                            
//                                                                                )`);
 
 
//                                                      console.log('Consulta pagamento boleto!');
 
//                                                      console.log(dado.id_unico);
 
//                                                      boletos.consultaPagamentoBoleto(dado.id_unico)
//                                                            .then(async function (response) {
 
//                                                                  console.log(response.data[0].registro_sistema_bancario);
//                                                                  let status = response.data[0].registro_sistema_bancario;
 
//                                                                  const result_update = await sql.query(`UPDATE
//                                                                                                                 BOLETO_COBRANCA_PJBANK
//                                                                                                         SET
//                                                                                                                 BCPJ_STATUS = '${status}'
//                                                                                                         WHERE
//                                                                                                                 BCPJ_ID_UNICO = '${dado.id_unico}'`);
//                                                            })
//                                                            .catch(function (error) {
//                                                                  console.log(error);
//                                                                  res.json(error);
//                                                            });
 
//                                                })
 
//                                          }
 
//                                          obj_result.erro = [];
//                                          console.log(obj_result);
//                                          res.json(obj_result);
 
//                                    } else {
//                                          res.json('Problema na requisição');
//                                    }
 
//                         })
//                         .catch(function (error) {
 
//                                    console.log(error);
//                                    res.json({ 'boleto': 'Problema na requisição'});
//                         });

// }

// module.exports = {gerarBoletosRequisicao};