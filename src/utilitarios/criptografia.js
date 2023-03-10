var CryptoJS = require("crypto-js");

const criptografar = (senha) => {

    var senha_criptografada = CryptoJS.AES.encrypt(senha, 'secret key 123').toString();

    return senha_criptografada;
};

const descriptografar = (senha) => {

    var bytes  = CryptoJS.AES.decrypt(senha,'secret key 123');
    var senha_original = bytes.toString(CryptoJS.enc.Utf8);

    return senha_original;
};

module.exports = {criptografar, descriptografar};
