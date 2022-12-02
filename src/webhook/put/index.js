
const { recebimentoBoleto } = require('./recebimentoBoleto');

 const putWebHook = (req, res) => {

    let tipo = req.body.tipo;

    switch(tipo){

        case "recebimento_boleto":
            recebimentoBoleto(req,res)
            .then(resp => console.log(resp))
            .catch(err => console.log(err));
            break;

        default:
            break;

    }

}

module.exports = {putWebHook};