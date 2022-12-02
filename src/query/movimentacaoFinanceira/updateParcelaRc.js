const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const updateParcelaRc = async ({data_pagamento, valor_pago, numero_pedido}) => {

    await sql.connect(config_conexao.sqlConfig);

    const update_parcela = await sql.query(`UPDATE 
                                                    TR_PARCELA_RC
                                            SET 
                                                    TRPR_DTBAIXA = '${data_pagamento}',
                                                    TRPR_VALPAGO = '${valor_pago}',
                                                    TRPR_STTR_COD   =   'QT'
                                            WHERE
                                                    TRPR_COD = ${numero_pedido}`);
}

module.exports = { updateParcelaRc };