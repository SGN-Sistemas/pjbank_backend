const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const createRelMovbcRc = async (numero_pedido, lastIDLOMB) => {

    await sql.connect(config_conexao.sqlConfig);

    const createRelMovRC = await sql.query(`Insert into 
                                                                rel_movbc_rc 
                                                                ( 
                                                                    REMR_TRPR_COD, 
                                                                    REMR_MOBA_COD , 
                                                                    REMR_DT
                                                                )
                                                            VALUES
                                                                ( 
                                                                    ${numero_pedido},
                                                                    ${lastIDLOMB},
                                                                    GETDATE()
                                                                )
                                        `);

}

module.exports = { createRelMovbcRc };