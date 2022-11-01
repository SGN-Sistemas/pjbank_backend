const sql = require('mssql');
const configBanco = require('../db/config_conexao');
const boletos = require('../../http/gerar_boleto');


const selectCredencialEmpresa = async (empresa) => {

  try {

    await sql.connect(configBanco.sqlConfig);
    const result = await sql.query`SELECT
                                                CPEM_CREDENCIAL,
                                                CPEM_URL_WEBHOOK,
                                                CPEM_URL_LOGO,
                                                CPEM_CHAVE
                                        FROM
                                                CREDENCIAL_PJBANK_EMPRESA
                                        WHERE
                                                CPEM_EMPR_COD = ${empresa}`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }
}

const dadosCobrancaTrParcelaRc = async (codigos) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`SELECT
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
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }
}

const dadosCliente = async (cliente_cod) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`SELECT
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
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }
}

const getBoletoCobrancaPjBank = async (pedido_numero) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`SELECT 
                                      BCPJ_COD,
                                      BCPJ_RECP_COD,
                                      BCPJ_ID_UNICO,
                                      BCPJ_PEDIDO_NUMERO,
                                      BCPJ_NOSSO_NUMERO
                                  FROM
                                      BOLETO_COBRANCA_PJBANK
                                  WHERE
                                      BCPJ_PEDIDO_NUMERO IN (${pedido_numero})`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }
}

const getDadosEmpresa = async (empresa_cod) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`SELECT 
                                        EMPR_NOME,
                                        EMPR_CGC,
                                        EMPR_CEP,
                                        EMPR_END,
                                        EMPR_BAIRRO,
                                        EMPR_CIDADE,
                                        EMPR_UNFE_SIGLA,
                                        EMPR_FONE,
                                        EMPR_EMAIL
                                    FROM 
                                        EMPRESA
                                    WHERE
                                        EMPR_COD = ${empresa_cod}`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }

}

const atualizaBoletoBanco = async (dado) => {

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
}

module.exports = { 
   selectCredencialEmpresa,
   dadosCobrancaTrParcelaRc, 
   dadosCliente, 
   getBoletoCobrancaPjBank,
   getDadosEmpresa,
   atualizaBoletoBanco
};