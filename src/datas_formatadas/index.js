function getFormatDate(data){

    let dia = (data.getDate() >= 10) ? ''+(data.getDate() + 1) : '0'+(data.getDate()+1);
    let mes = (data.getMonth() >= 10) ? ''+(data.getMonth() + 1) : '0'+(data.getMonth()+1);
    let ano = data.getFullYear();

    return ''+mes+'/'+dia+'/'+ano;
  }

  module.exports = { getFormatDate };