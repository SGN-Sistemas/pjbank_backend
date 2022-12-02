const { transacao } = require('./transacao');
const { tranferencia } = require('./transferencia');

 const postWebHook = (req, res) => {

    let tipo = req.body.tipo;

    switch(tipo){

        case "transacao":
            transacao(req, res);
            break;

        case "transferencia":
            tranferencia(req,res);
            break;

        default:
            break;

    }

}

module.exports = {postWebHook};