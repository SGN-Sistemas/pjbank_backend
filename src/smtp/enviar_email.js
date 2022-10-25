
function enviar_email(from, to, subject, body, transporter){

    const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: body
    }

    transporter.sendMail(mailOptions, function(error, info){

        if (error) {
           console.log(error);
        } else {
           console.log('Email enviado: ' + info.response);
        }
    });

}

module.exports = {enviar_email};