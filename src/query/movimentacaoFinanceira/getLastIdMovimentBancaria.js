const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const getLastIdMovimentBancaria = async () => {

    await sql.connect(config_conexao.sqlConfig);

    const selectLastID = await sql.query(`
                                            SELECT 
                                                MAX(MOBA_COD) + 1 as MOBA_COD
                                            FROM 
                                                moviment_bancaria`);
    return selectLastID;
}

module.exports = { getLastIdMovimentBancaria };