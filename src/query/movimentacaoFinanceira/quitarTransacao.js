const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const quitarTransacao = async (TRPR_TRRC_COD) => {

    await sql.connect(config_conexao.sqlConfig);

    const updateTRRC_STTR_COD = await sql.query(`
                                                UPDATE
                                                    TRANSACAO_RC
                                                SET
                                                    TRRC_STTR_COD   =   'QT'
                                                WHERE 
                                                    TRRC_COD = ${TRPR_TRRC_COD}
                                            `);
    
}

module.exports = { quitarTransacao };