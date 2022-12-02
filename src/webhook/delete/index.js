const {transacaoDocumento} = require("./transacaoDocumento");

const deleteWebHook = (req, res) => {

    let tipo = req.body.tipo;

    switch(tipo){

        case "transacao_documento":
            transacaoDocumento(req, res);
            break;

        default:
            break;

    }

}

module.exports = {deleteWebHook};