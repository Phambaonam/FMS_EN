module.exports = function (customer_email, subject, text) {
    // https://codemoto.io/coding/nodejs/email-verification-node-express-mongodb
    // https://www.google.com.vn/search?ei=_pr5WYPeB4PGvgTyiLbwAQ&q=how+to+verify+register+account+register+in+nodejs&oq=how+to+verify+register+account+register+in+nodejs&gs_l=psy-ab.3...91231.153025.0.153193.85.79.6.0.0.0.157.7064.47j26.73.0....0...1.1.64.psy-ab..6.71.6437...0j35i39k1j0i131k1j0i67k1j0i203k1j0i22i10i30k1j0i22i30k1j0i19k1j0i13i30i19k1j0i22i30i19k1j0i8i13i30i19k1j33i22i29i30k1j33i21k1j33i160k1.0.gzQXJ8_NQ94
    const nodemailer = require('nodemailer')
    let infoMail = require('../../config/config')
    let transporter = nodemailer.createTransport({
        // https://myaccount.google.com/lesssecureapps
        service: 'Gmail',
        auth: {
            user: infoMail.email,
            pass: infoMail.name
        }
    })

    let mailOptions = {
        from: 'phambaonam1312@gmail.com', // sender address
        to: customer_email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
    }
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error)
        console.log('Mail đã được gửi!')
        return true
    })


}