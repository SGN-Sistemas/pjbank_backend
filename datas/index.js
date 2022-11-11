function dataAtual(){

    var mes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    let data_atual = new Date();

    console.log("dia " + data_atual.getDate());
    console.log("mes " + mes[data_atual.getMonth()]);
    console.log("ano " + data_atual.getFullYear());

    console.log(data_atual);

    let data_atual_stamp = data_atual.getTime();

    let atual_futura = data_atual_stamp * 60 *60 * 24 * 3;

    console.log("3 dias a frente "+ new Date(atual_futura));
}

module.exports = dataAtual;