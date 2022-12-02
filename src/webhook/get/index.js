

const getWebHook = (req, res) => {

    res.status(200).json({ ...req.body, "status": "200" });

}

module.exports = { getWebHook };