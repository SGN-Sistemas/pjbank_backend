const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const transacaogetInnerParcelaCobranca = async (numero_pedido) => {

    await sql.connect(config_conexao.sqlConfig);

    const selectsuccCod = await sql.query(` SELECT 
                                                COBR_SUCC_COD,
                                                TRRC_NUM_DOC,
                                                COBR_TIMB_COD,
                                                TRPR_TRRC_COD
                                            FROM
                                                TR_PARCELA_RC 
                                            INNER JOIN 
                                                REL_COBRANCA_PARCELAS 
                                            ON
                                                RECP_TIPO_COD = TRPR_COD
                                            INNER JOIN
                                                COBRANCA
                                            ON
                                                COBR_COD = RECP_COBR_COD
                                            inner join 
                                                transacao_rc
                                            on
                                                transacao_rc.trrc_cod = TR_PARCELA_RC. trpr_trrc_cod
                                            WHERE
                                                TRPR_COD = ${numero_pedido}`);

    return selectsuccCod;

}

module.exports = { transacaogetInnerParcelaCobranca };