const transacaoDocumento = (req, res) =>{

    res.json({...req.body, "status": 200});
}

module.exports = {transacaoDocumento};