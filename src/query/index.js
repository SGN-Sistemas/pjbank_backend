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
                                                CPEM_CHAVE,
                                                CPEM_CONTA_VIRTUAL,
                                                CPEM_AGENCIA_VIRTUAL
                                        FROM
                                                CREDENCIAL_PJBANK_EMPRESA
                                        WHERE
                                                CPEM_EMPR_COD = ${empresa}
                                        AND
                                                CPEM_PRODUCAO = 'N'`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }
}

const selectCredencialEmpresaSemContaDigital = async (empresa) => {

  try {

    await sql.connect(configBanco.sqlConfig);
    const result = await sql.query`SELECT
                                                CPEM_CREDENCIAL,
                                                CPEM_URL_WEBHOOK,
                                                CPEM_URL_LOGO,
                                                CPEM_CHAVE,
                                                CPEM_CONTA_VIRTUAL,
                                                CPEM_AGENCIA_VIRTUAL
                                        FROM
                                                CREDENCIAL_PJBANK_EMPRESA
                                        WHERE
                                                CPEM_EMPR_COD = ${empresa}
                                        AND
                                                CPEM_CONTA_VIRTUAL IS NOT NULL OR CPEM_CONTA_VIRTUAL <> ''`;
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
                                          CLIE_TIPO_COD,
                                          TRPR_OBS
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

const getDadosContatoCliente = async (clie_cod) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`  SELECT 
                                          PEJU_CGC as cpf_cnpf,
                                          PEJU_EMAIL as email,
                                          PEJU_UNFE_SIGLA as uf,
                                          PEJU_CIDADE as cidade,
                                          PEJU_BAIRRO as bairro,
                                          PEJU_RAZAO_SOCIAL as nome,
                                          PEJU_END as ende,
                                          PEJU_CEP as cep
                                     FROM 
                                          PESSOA_JURIDICA
                                     INNER JOIN
                                          CLIENTE
                                     ON 
                                          CLIE_TIPO_COD = PEJU_COD 
                                     AND
                                          CLIE_TIPO = 'J'
                                     AND
                                          CLIE_TIPO_COD = ${clie_cod}
                                          
                                          UNION	
                                          
                                     SELECT 
                                            PEFI_CPF as cpf_cnpf,
                                            PEFI_EMAIL as email,
                                            PEFI_UNFE_SIGLA as uf,
                                            PEFI_CIDADE as cidade,
                                            PEFI_BAIRRO as bairro,
                                            PEFI_NOME as nome,
                                            PEFI_END as ende,
                                            PEFI_CEP as cep
                                     FROM 
                                            PESSOA_FISICA
                                     INNER JOIN
                                            CLIENTE
                                     ON 
                                            CLIE_TIPO_COD = PEFI_COD
                                     AND
                                            CLIE_TIPO = 'F'
                                     AND
                                            CLIE_TIPO_COD = ${clie_cod}`;
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
                                        PEFI_CPF AS CPF,
                                        PEFI_UNFE_SIGLA AS UNFE,
                                        PEFI_CIDADE AS CIDADE,
                                        PEFI_END AS ENDERECO,
                                        PEFI_BAIRRO AS BAIRRO,
                                        PEFI_CEP AS CEP,
                                        CLIE_TIPO,
                                        PEFI_EMAIL AS EMAIL,
                                        PEFI_TEL AS TELEFONE
                                    FROM
                                        CLIENTE
                                    INNER JOIN
                                        PESSOA_FISICA
                                    ON
                                        PEFI_COD = CLIE_TIPO_COD
                                    WHERE
                                        CLIE_TIPO_COD = ${cliente_cod}
                                    AND
                                        CLIE_TIPO = 'F'

                                    UNION

                                    SELECT
                                        CLIE_COD,
                                        CLIE_NOME,
                                        PEJU_CGC AS CPF,
                                        PEJU_UNFE_SIGLA_COBR AS UNFE,
                                        PEJU_CIDADE AS CIDADE,
                                        PEJU_END AS ENDERECO,
                                        PEJU_BAIRRO AS BAIRRO,
                                        PEJU_CEP_COBR AS CEP,
                                        CLIE_TIPO,
                                        PEJU_EMAIL AS EMAIL,
                                        PEJU_TEL AS TELEFONE
                                    FROM
                                        CLIENTE
                                    INNER JOIN
                                        PESSOA_JURIDICA
                                    ON
                                        PEJU_COD = CLIE_TIPO_COD
                                    WHERE
                                        CLIE_TIPO_COD = ${cliente_cod}
                                    AND
                                        CLIE_TIPO = 'J'`;
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

const getPix = async (empr_clie_cod, tipo = 'E') => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`SELECT 
                                      CHPI_TIPO,
                                      CHPI_CHAVE
                                   FROM 
                                      CHAVES_PIX
                                   WHERE
                                      CHPI_EMPR_COD = ${empr_clie_cod}`;
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
                                                                 let status = (response.data[0].registro_sistema_bancario) ? response.data[0].registro_sistema_bancario : '';
 
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

const salvaCredenciaisEmpresa = async (dados) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`INSERT INTO CREDENCIAL_PJBANK_EMPRESA
                                                  (
                                                    CPEM_EMPR_COD,
                                                    CPEM_CREDENCIAL,
                                                    CPEM_CHAVE,
                                                    CPEM_WEBHOOK_CHAVE
                                                  )
                                                  VALUES
                                                  (
                                                    ${dados.empresa_cod},
                                                    ${dados.credencial},
                                                    ${dados.chave},
                                                    ${dados.webhook_chave}
                                                  )`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }

}

const salvaCredenciaisEmpresaCredencial = async (dados) => {

  try {

    await sql.connect(configBanco.sqlConfig);

    const result = await sql.query`INSERT INTO CREDENCIAL_PJBANK_EMPRESA
                                                  (
                                                    CPEM_EMPR_COD,
                                                    CPEM_CREDENCIAL,
                                                    CPEM_CHAVE,
                                                    CPEM_WEBHOOK_CHAVE,
                                                    CPEM_CONTA_VIRTUAL,
                                                    CPEM_AGENCIA_VIRTUAL

                                                  )
                                                  VALUES
                                                  (
                                                    ${dados.empresa_cod},
                                                    ${dados.credencial},
                                                    ${dados.chave},
                                                    ${dados.webhook_chave},
                                                    ${dados.conta_virtual},
                                                    ${dados.agencia_virtual}
                                                  )`;
    return result;

  } catch (err) {
    console.log(err);
    return err;
  }

}

module.exports = { 
   selectCredencialEmpresa,
   dadosCobrancaTrParcelaRc, 
   dadosCliente, 
   getBoletoCobrancaPjBank,
   getDadosEmpresa,
   atualizaBoletoBanco,
   getPix,
   salvaCredenciaisEmpresa,
   salvaCredenciaisEmpresaCredencial,
   selectCredencialEmpresaSemContaDigital,
   getDadosContatoCliente
};