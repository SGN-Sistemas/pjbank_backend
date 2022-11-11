function diferenca_data(){

    var day1 = new Date("08/25/2020");
    var day2 = new Date("12/25/2021");

    var difference = Math.abs(day2-day1);;

    difference = difference / ( 3600 * 1000 * 24);

    console.log(difference);
}

module.exports = diferenca_data;