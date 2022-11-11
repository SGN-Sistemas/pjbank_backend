const { DownloaderHelper } = require('node-downloader-helper');


const download = (link,namePDF) => {
    
    const dl = new DownloaderHelper(
        link,
        '/var/www/html/pj_bank_teste/pdf',
        {
            fileName:`${namePDF}`
        }
    );

    dl.on('end', () => console.log('Download Completed'));

    dl.on('error', (err) => console.log('Download Failed', err));   

    dl.start().catch(err => console.error(err));

}

module.exports = download;