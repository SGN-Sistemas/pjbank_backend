function getFormatDate(data){

  console.log('teste')

  console.log(data.getDate());
  console.log(data.getMonth());

    let dia = (data.getDate() >= 10) ? data.getDate()+1 : '0'.concat(data.getDate());
    let mes = (data.getMonth() >= 9) ? (data.getMonth() +1): '0'.concat(data.getMonth() +1);
    let ano = data.getFullYear();

    return ''+mes+'/'+dia+'/'+ano;
  }

  module.exports = { getFormatDate };