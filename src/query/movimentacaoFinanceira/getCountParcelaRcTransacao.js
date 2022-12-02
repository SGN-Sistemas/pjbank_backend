const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const getCountParcelaRcTransacao = async (TRPR_TRRC_COD) => {

    await sql.connect(config_conexao.sqlConfig);

    const selectTRRC_STTR_COD = await sql.query(`SELECT
                                                        COUNT(TRPR_COD) AS COUNT
                                                 FROM 
                                                        TR_PARCELA_RC
                                                 INNER JOIN
                                                        TRANSACAO_RC
                                                 ON 
                                                        TRRC_COD = TRPR_TRRC_COD
                                                 WHERE 
                                                        TRPR_STTR_COD = 'NO'
                                                 AND
                                                        TRRC_COD = ${TRPR_TRRC_COD}
                                                 `);
    return selectTRRC_STTR_COD;
}

module.exports = { getCountParcelaRcTransacao };