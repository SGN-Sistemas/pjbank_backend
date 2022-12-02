const transacao = (req, res) => {

    console.log('TRANSAÇÃO');

    console.log(req.body);

    res.status(201).json({ "status": "201" });

}

module.exports = {transacao};