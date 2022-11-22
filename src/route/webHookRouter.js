var express = require('express');
const router = express.Router();
const sql = require('mssql');
const config_conexao = require('../db/config_conexao');

router.get('/webhook', function (req, res) {

    res.json({ "status": "200" });

})

router.post('/webhook', function (req, res) {

    if (req.body.tipo == 'transacao') {

        console.log('TRANSAÇÃO');

        console.log(req.body);

        res.json({ "status": "200" });

    } else if (req.body.tipo == 'transferencia') {

        console.log('TRANFERÊNCIA');

        console.log(req.body);

        res.json({ "status": "200" });

    }

});

router.put('/webhook', async function (req, res) {

    try {

        await sql.connect(config_conexao.sqlConfig);

        if (req.body.tipo == 'transacao_documento') {

            console.log('Documento ' + req.body.documento[0].nome + ' vinculado a transação')

            console.log(req.body);

            res.json(req.body);

        } else if (req.body.tipo == "conta_digital") {

            res.json({ "status": "200" });

        } else if (req.body.tipo == 'recebimento_boleto') {

            console.log("PJbank acessou via webhook!");

            let data_pagamento = '';

            if (req.body.data_pagamento) {

                let data_array = req.body.data_pagamento.split('/');
                let data_formatada = data_array[2] + "-" + data_array[0] + "-" + data_array[1];
                data_pagamento = data_formatada;

                let id_unico = req.body.id_unico;
                let valor_pago = parseFloat(req.body.valor);

                const select_boleto_cobranca = await sql.query(`SELECT 
                                                                            BCPJ_PEDIDO_NUMERO
                                                                    FROM
                                                                            BOLETO_COBRANCA_PJBANK
                                                                    WHERE
                                                                            BCPJ_ID_UNICO = '${id_unico}'`);

                if (select_boleto_cobranca.rowsAffected > 0) {

                    let numero_pedido = select_boleto_cobranca.recordset[0].BCPJ_PEDIDO_NUMERO;


                    const result_update = await sql.query(`UPDATE 
                                                                    BOLETO_COBRANCA_PJBANK 
                                                                SET 
                                                                        BCPJ_DT_PAGAMENTO = '${data_pagamento}'
                                                                WHERE
                                                                        BCPJ_ID_UNICO = '${id_unico}'`);

                    const update_parcela = await sql.query(`UPDATE 
                                                                    TR_PARCELA_RC
                                                                SET 
                                                                    TRPR_DTBAIXA = '${data_pagamento}',
                                                                    TRPR_VALPAGO = '${valor_pago}',
                                                                    TRPR_STTR_COD   =   'QT'
                                                                WHERE
                                                                    TRPR_COD = ${numero_pedido}`);

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
                                                            WHERE
                                                                TRPR_COD = ${numero_pedido}`);

                    const selectLastID = await sql.query(`
                                                        SELECT 
                                                            MAX(MOBA_COD) + 1 
                                                        FROM 
                                                            moviment_bancaria`);

                    const succID = selectsuccCod.recordset[0].SUCC_COD;

                    const COBR_TIMB_COD = selectsuccCod.recordset[0].COBR_TIMB_COD;

                    const TRRC_NUM_DOC = selectsuccCod.recordset[0].TRRC_NUM_DOC;

                    const TRPR_TRRC_COD = selectsuccCod.recordset[0].TRPR_TRRC_COD;

                    const selectSaldo = await sql.query(`
                                                        SELECT
                                                            ISNULL(SUCC_SALDO,0) as SALDO
                                                        FROM 
                                                            SUB_CONTA_CORRENTE 
                                                        WHERE 
                                                            SUCC_COD = ${succID}`)

                    const selectIDLogMoba = await sql.query(`SELECT 
                                                                MAX(lomb_moba_cod) + 1 
                                                            FROM 
                                                                LOG_MOVIMENT_BANCARIA`)

                    if (selectLastID.rowsAffected > 0) {

                        let lastID = selectLastID.recordset[0].MOBA_COD;

                        let saldo = selectSaldo.recordset[0].SALDO + valor_pago;

                        let lastIDLOMB = selectIDLogMoba.recordset[0].LOMB_MOBA_COD

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
                                    'GETDATE()',
                                    ${COBR_TIMB_COD},
                                    ${saldo},
                                    'C',
                                    '${TRRC_NUM_DOC}'
                                )
                        `)

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
                                                                        'GETDATE()',
                                                                        'GETDATE()',
                                                                        'I'
                                                                    )
                        `)

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
                                                                        'GETDATE()'
                                                                    )
                        `)

                    }

                    const selectTRRC_STTR_COD = await sql.query(`SELECT
                                                                    COUNT(TRPR_COD) AS COUNT
                                                                FROM 
                                                                    TR_PARCELA_RC
                                                                INNER JOIN
                                                                    TRANSACAO_RC
                                                                ON 
                                                                    TRRC_COD = TRPR_TRRC_COD
                                                                WHERE 
                                                                    TRPR_STTR_COD = 'NO'
                                                                AND
                                                                    TRRC_COD = ${TRPR_TRRC_COD}
                    `)

                    if (selectTRRC_STTR_COD.recordset[0].COUNT = 0) {

                        const updateTRRC_STTR_COD = await sql.query(`
                            UPDATE
                                TRANSACAO_RC
                            SET
                                TRRC_STTR_COD   =   'QT'
                            WHERE 
                                TRRC_COD = ${TRPR_TRRC_COD}
                        `)
                    }

                    const updateSUCCSaldo   =   await sql.query(`
                        UPDATE
                            SUB_CONTA_CORRENTE
                        SET
                            SUCC_SALDO  =   ${saldo}
                        WHERE
                            SUCC_COD = ${succID}
                    `)

                    console.log("Baixou o recebimento!");
                }

                res.json({ "status": "200" });

            }
        }

    } catch (err) {
        
        console.log(err);

        res.json({ "status": "501", "descricao": err });
    }
});

router.delete('/webhook', (req, res) => {

    if (req.body.tipo == 'transacao_documento') {

        console.log(req.body);
3
        res.json({ "status": "200" });
    }

});

module.exports = router;