const limpaMascaraTelefone = (telefone) => {

    telefone = telefone.replaceAll(' ', '');
    telefone = telefone.replaceAll('-', '');
    telefone = telefone.replaceAll('(', '');
    telefone = telefone.replaceAll(')', '');

    return telefone;
}

const limpaMascaraCNPJ = (cnpj) => {

    cnpj = cnpj.replaceAll('.', '');
    cnpj = cnpj.replaceAll('/', '');
    cnpj = cnpj.replaceAll('-', '');
    cnpj = cnpj.replaceAll(' ', '');

    return cnpj;
}

const limpaMascaraCEP = (cep) => {

    cep = cep.replaceAll('-', '');
    cep = cep.replaceAll(' ', '');
    cep = cep.replaceAll('.', '');
   

    return cep;
}

module.exports = {limpaMascaraTelefone, limpaMascaraCNPJ, limpaMascaraCEP};