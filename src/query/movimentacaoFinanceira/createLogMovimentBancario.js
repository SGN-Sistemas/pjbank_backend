const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const createLogMovimentBancario = async (lastIDLOMB) => {

    await sql.connect(config_conexao.sqlConfig);

    const createLogMovDiario = await sql.query(`INSERT INTO 
                                                                LOG_MOVIMENT_BANCARIA 
                                                                ( 
                                                                    lomb_moba_cod, 
                                                                    lomb_usua_cod, 
                                                                    lomb_data, 
                                                                    lomb_hora, 
                                                                    lomb_operacao
                                                                )
                                                                VALUES
                                                                (
                                                                    ${lastIDLOMB},
                                                                    1,
                                                                    GETDATE(),
                                                                    GETDATE(),
                                                                    'I'
                                                                )
                                                `);
}

module.exports = { createLogMovimentBancario };