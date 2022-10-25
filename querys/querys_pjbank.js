// const sql = require('mssql');

// async function dadosParcelas(codigos){

//     const dados_cobranca = await sql.query`SELECT
//                                                 TRRC_EMPR_COD,
//                                                 TRRC_CLIE_COD,
//                                                 TRPR_COD,
//                                                 TRPR_DTVENC,
//                                                 TRPR_VALPREV,
//                                                 TRPR_VALJUR,
//                                                 TRPR_VALMULTA,
//                                                 TRPR_VALDESC,
//                                                 CLIE_TIPO_COD
//                                             FROM
//                                                 TR_PARCELA_RC
//                                             INNER JOIN
//                                                 TRANSACAO_RC
//                                             ON
//                                                 TR_PARCELA_RC.TRPR_TRRC_COD = TRANSACAO_RC.TRRC_COD
//                                             INNER JOIN
//                                                 CLIENTE
//                                             ON
//                                                 TRANSACAO_RC.TRRC_CLIE_COD = CLIENTE.CLIE_COD
//                                             WHERE
//                                                 TRPR_COD IN (${codigos})`;

//         return dados_cobranca;
// }

// module.exports = {dadosParcelas};