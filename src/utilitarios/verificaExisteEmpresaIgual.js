
const verificaExisteClienteIgual = (arrayCobranca) =>{

    let arrayClientes = arrayCobranca.map(cobranca => cobranca.TRRC_CLIE_COD);

    let primeiroElemento = arrayClientes[0];

    let igual = true;

    arrayClientes.forEach(element => {
        if(element !== primeiroElemento){
            igual = false;
        }
    });

    return igual;

}

// const arrayEmails = (arrayCobrancas) => {

//     let array_emails = arrayCobrancas.map(cobranca => cobranca.)

// }

module.exports = {verificaExisteClienteIgual};