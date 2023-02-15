const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const getBoletoCobrancaPjbank = async (id_unico) => {

    await sql.connect(config_conexao.sqlConfig);

    const select_boleto_cobranca = await sql.query(`SELECT 
                                                        BCPJ_PEDIDO_NUMERO
                                                    FROM
                                                        BOLETO_COBRANCA_PJBANK
                                                    WHERE
                                                        BCPJ_ID_UNICO = '${id_unico}'`);

   return select_boleto_cobranca;
}

module.exports = {getBoletoCobrancaPjbank};