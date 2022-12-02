const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const newIdLogMovimentBancaria = async () => {

    await sql.connect(config_conexao.sqlConfig);

    const selectIDLogMoba = await sql.query(`SELECT 
                                                    MAX(lomb_moba_cod) + 1 as LOMB_MOBA_COD
                                             FROM 
                                                    LOG_MOVIMENT_BANCARIA`);
    return selectIDLogMoba;
}

module.exports = { newIdLogMovimentBancaria };