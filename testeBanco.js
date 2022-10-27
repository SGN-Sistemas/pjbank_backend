const sql = require('mssql');
const configBanco = require('./src/db/config_conexao');


const select = async () => {

    try {
    // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(configBanco.sqlConfig);
        const result = await sql.query`SELECT
                                                CPEM_CREDENCIAL,
                                                CPEM_URL_WEBHOOK,
                                                CPEM_URL_LOGO
                                        FROM
                                                CREDENCIAL_PJBANK_EMPRESA
                                        WHERE
                                                CPEM_EMPR_COD = 1`;
        return result;
    } catch (err) {
        console.log(err);
    }
}

module.exports ={select};