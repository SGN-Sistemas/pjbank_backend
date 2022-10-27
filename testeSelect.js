const selects = require('./testeBanco.js');

selects.select()
.then((resposta => console.log(resposta)))
.catch(err => console.log(err))