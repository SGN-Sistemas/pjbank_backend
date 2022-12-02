const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const updateDateBoletoCobrancaPjbank = async (data_pagamento, id_unico) => {

    await sql.connect(config_conexao.sqlConfig);

    const result_update = await sql.query(`UPDATE 
                                                BOLETO_COBRANCA_PJBANK 
                                           SET 
                                                BCPJ_DT_PAGAMENTO = '${data_pagamento}'
                                           WHERE
                                                BCPJ_ID_UNICO = '${id_unico}'`);
}

module.exports = { updateDateBoletoCobrancaPjbank };