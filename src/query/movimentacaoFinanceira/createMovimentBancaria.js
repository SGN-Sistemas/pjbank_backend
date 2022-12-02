const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const createMovimentBancaria = async (lastID, numero_pedido, valor_pago, succID, COBR_TIMB_COD, saldo, TRRC_NUM_DOC) => {

    await sql.connect(config_conexao.sqlConfig);

    const createMovimentDiario = await sql.query(`   
                                                INSERT INTO
                                                    MOVIMENT_BANCARIA
                                                    (
                                                        moba_cod, 
                                                        moba_historico, 
                                                        moba_ind_conciliac, 
                                                        moba_val_lancam,
                                                        moba_succ_cod, 
                                                        moba_dt,
                                                        moba_timb_cod,
                                                        moba_saldo_conta, 
                                                        moba_tipodc,
                                                        moba_num_doc
                                                    )
                                                VALUES
                                                    (
                                                        ${lastID},
                                                        'Baixa Conciliada da parcela ${numero_pedido} Via PJ Bank',
                                                        'S',
                                                        '${valor_pago}',
                                                        ${succID},
                                                        GETDATE(),
                                                        ${COBR_TIMB_COD},
                                                        ${saldo},
                                                        'C',
                                                        '${TRRC_NUM_DOC}'
                                                    )
                                            `);
}

module.exports = { createMovimentBancaria };