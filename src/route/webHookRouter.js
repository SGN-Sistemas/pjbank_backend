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

            let data_pagamento = '';

            if (req.body.data_pagamento) {

                    let data_array = req.body.data_pagamento.split('/');
                    let data_formatada = data_array[2] + "-" + data_array[0] + "-" + data_array[1];
                    data_pagamento = data_formatada;

                    let id_unico = req.body.id_unico;
                    let valor_pago =  parseFloat(req.body.valor.replace(',', '.'));

                    const select_boleto_cobranca = await sql.query(`SELECT 
                                                                            BCPJ_PEDIDO_NUMERO
                                                                    FROM
                                                                            BOLETO_COBRANCA_PJBANK
                                                                    WHERE
                                                                            BCPJ_ID_UNICO = '${id_unico}'`);

                    if(select_boleto_cobranca.rowsAffected > 0){

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
                                                                    TRPR_VALPAGO = '${valor_pago}'
                                                                WHERE
                                                                    TRPR_COD = ${numero_pedido}`);

                        console.log("Baixou o recebimento!");
                    }

                        res.json({ "status": "200" });

            }
        }

    } catch (err) {
        console.log(err);
    }
});

router.delete('/webhook', (req, res) => {

    if (req.body.tipo == 'transacao_documento') {

        console.log(req.body);

        res.json({ "status": "200" });
    }

});

module.exports = router;