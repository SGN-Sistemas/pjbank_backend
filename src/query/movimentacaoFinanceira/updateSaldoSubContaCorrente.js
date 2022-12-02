const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const updateSaldoSubContaCorrente = async (saldo, succID) => {

    await sql.connect(config_conexao.sqlConfig);

    const updateSUCCSaldo   =   await sql.query(`
                                                UPDATE
                                                    SUB_CONTA_CORRENTE
                                                SET
                                                    SUCC_SALDO  =   ${saldo}
                                                WHERE
                                                    SUCC_COD = ${succID}
                                            `);

}

module.exports = { updateSaldoSubContaCorrente };