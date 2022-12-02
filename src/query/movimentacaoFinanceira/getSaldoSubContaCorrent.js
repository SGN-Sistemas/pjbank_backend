const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const getSaldoSubContaCorrent = async (succID) => {

    await sql.connect(config_conexao.sqlConfig);

    const selectSaldo = await sql.query(`
                                            SELECT
                                                  ISNULL(SUCC_SALDO,0) as SALDO
                                            FROM 
                                                  SUB_CONTA_CORRENTE 
                                            WHERE 
                                                  SUCC_COD = ${succID}`);
    return selectSaldo;
}

module.exports = { getSaldoSubContaCorrent };