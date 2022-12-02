const tranferencia = (req, res) => {

    console.log('TRANFERÊNCIA');

    console.log(req.body);

    res.status(201).json({ "status": "201" });
}

module.exports = {tranferencia};