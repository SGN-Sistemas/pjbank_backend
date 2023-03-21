const { DownloaderHelper } = require('node-downloader-helper');

const downloadPdf = (url, caminho, filename) => {

    let nome_arquivo = filename ? (filename + ".pdf") : "Sem titulo.pdf";

    console.log(nome_arquivo);

    const dl = new DownloaderHelper(url, caminho, {fileName: nome_arquivo});

    dl.on('end', () => console.log('Download Completed'));
    dl.on('error', (err) => console.log('Download Failed', err));
    dl.start().catch(err => console.error(err));

}

module.exports = {downloadPdf};