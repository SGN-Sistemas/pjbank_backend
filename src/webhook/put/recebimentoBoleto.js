const sql = require('mssql');
const config_conexao = require('../../db/config_conexao');

const { getBoletoCobrancaPjbank } = require('../../query/movimentacaoFinanceira/getBoletoCobrancaPjbank');
const { updateDateBoletoCobrancaPjbank } = require('../../query/movimentacaoFinanceira/updateDateBoletoCobrancaPjbank');
const { updateParcelaRc } = require('../../query/movimentacaoFinanceira/updateParcelaRc');
const { transacaogetInnerParcelaCobranca } = require('../../query/movimentacaoFinanceira/transacaogetInnerParcelaCobranca');
const { getLastIdMovimentBancaria } = require('../../query/movimentacaoFinanceira/getLastIdMovimentBancaria');
const { getSaldoSubContaCorrent } = require('../../query/movimentacaoFinanceira/getSaldoSubContaCorrent');
const { newIdLogMovimentBancaria } = require('../../query/movimentacaoFinanceira/newIdLogMovimentBancaria');
const { createMovimentBancaria } = require('../../query/movimentacaoFinanceira/createMovimentBancaria');
const { createLogMovimentBancario } = require('../../query/movimentacaoFinanceira/createLogMovimentBancario');
const { createRelMovbcRc } = require('../../query/movimentacaoFinanceira/createRelMovbcRc');
const { getCountParcelaRcTransacao } = require('../../query/movimentacaoFinanceira/getCountParcelaRcTransacao');
const { quitarTransacao } = require('../../query/movimentacaoFinanceira/quitarTransacao');
const { updateSaldoSubContaCorrente } = require('../../query/movimentacaoFinanceira/updateSaldoSubContaCorrente');

const recebimentoBoleto = async (req, res, next) => {

 try{

    await sql.connect(config_conexao.sqlConfig);

    console.log("PJbank acessou via webhook!");

        let data_pagamento = '';
        let saldo = 0;

        console.log(req.body);

        if (req.body.data_pagamento) {

            let data_array = req.body.data_pagamento.split('\/');
            let data_formatada = data_array[2] + "-" + data_array[1] + "-" + data_array[0];
            data_pagamento = data_formatada;

            let id_unico = req.body.id_unico;
            let valor_pago = parseFloat(req.body.valor);

            const select_boleto_cobranca = await getBoletoCobrancaPjbank(id_unico);

            console.log(select_boleto_cobranca.recordset[0].BCPJ_PEDIDO_NUMERO);

            if (select_boleto_cobranca.rowsAffected > 0) {

                let numero_pedido = select_boleto_cobranca.recordset[0].BCPJ_PEDIDO_NUMERO;

                await updateDateBoletoCobrancaPjbank(data_pagamento, id_unico);

                await updateParcelaRc({data_pagamento, valor_pago, numero_pedido});

                const selectsuccCod = await transacaogetInnerParcelaCobranca(numero_pedido);

                const selectLastID = await getLastIdMovimentBancaria();

                const succID = selectsuccCod.recordset[0].COBR_SUCC_COD;

                const COBR_TIMB_COD = selectsuccCod.recordset[0].COBR_TIMB_COD;

                const TRRC_NUM_DOC = selectsuccCod.recordset[0].TRRC_NUM_DOC;

                const TRPR_TRRC_COD = selectsuccCod.recordset[0].TRPR_TRRC_COD;

                const selectSaldo = await getSaldoSubContaCorrent(succID);

                const selectIDLogMoba = await newIdLogMovimentBancaria();

                if (selectLastID.rowsAffected > 0) {

                    let lastID = selectLastID.recordset[0].MOBA_COD;

                    saldo = selectSaldo.recordset[0].SALDO + valor_pago;

                    let lastIDLOMB = selectIDLogMoba.recordset[0].LOMB_MOBA_COD;
            
                    await createMovimentBancaria(lastID, numero_pedido, valor_pago, succID, COBR_TIMB_COD, saldo, TRRC_NUM_DOC);

                    await createLogMovimentBancario(lastIDLOMB);

                    await createRelMovbcRc(numero_pedido, lastIDLOMB);

                }else{

                    res.json({ "status": "501", "message": "Não conseguiu pegar o last id!"});

                    console.log("Não conseguiu pegar o last id!");
                }

                const selectTRRC_STTR_COD = await getCountParcelaRcTransacao(TRPR_TRRC_COD);

                if (selectTRRC_STTR_COD.recordset[0].COUNT = 0) {

                    await quitarTransacao(TRPR_TRRC_COD);
                }

                await updateSaldoSubContaCorrente(saldo, succID);

                console.log("Baixou o recebimento!");

                res.json({ "status": "200", "message":  "Recebimento realizado com sucesso!"});

            }else{

                console.log('Sem registros do BOLETO_COBRANCA_PJBANK');
                res.json({ "status": "501", "message": "Sem registros do BOLETO_COBRANCA_PJBANK"});
            }

        }else{

            console.log("Não existe ou está vazio o atributo data_pagamento no json do pjbank");              
            res.json({ "status": "501", "message": "Não existe ou está vazio o atributo data_pagamento no json do pjbank"});
        }

    } catch (err) {

        console.log(err);

        res.json({ "status": "501", "descricao": err });
    }

}

module.exports = {recebimentoBoleto};