module.exports.userInfo = function (db, router, frontendPath) {
    const bcrypt = require('bcrypt')
    const crypto = require('crypto')
    const nodeMail = require('../../reuse/sendMail')
    const passport = require('passport')
    router.post('/checkInfo', (req, res) => {
        const info = req.body
        if (info.email) {
            const getEmail = 'SELECT email FROM customer WHERE email = ${email};'
            db.one(getEmail, {
                email: info.email
            })
                .then(data => {
                    if (data.email) res.send('Email này đã được đăng ký!')
                })
                .catch(err => {
                    console.error(err.message)
                })
        } else if (info.password.length && info.password.length < 6) {
            res.send('Mật khẩu phải dài hơn 6 ký tự!')
        }

    })

    router.post('/register', (req, res) => {
        const info = req.body
        const token = crypto.randomBytes(16).toString('hex')
        const email = info.email
        const username = info.username
        const phone = info.phone
        const subject = 'Xác thực tài khoản!'
        const text = `Xin chào ${username}. Đây là email xác thực đăng kí tài khoản của bạn. Bạn hãy nhấp vào link để hoàn thành quá trình đăng ký: http://${req.headers.host}/confirmation/${token}`

        const saltRounds = 10
        const insertUser = 'INSERT INTO customer(username,email,password,phone,image,date_of_birth,general,time_register,address_receiver,token_register,verify_token_register,role) VALUES (${username}, ${email}, ${password},${phone},null,null,null,null,null,${token_register},null,null);'
        const getEmail = 'SELECT id, username, email, phone, general FROM customer WHERE email = ${email}'
        bcrypt.hash(info.password, saltRounds, (err, hash) => {
            db.task('user resgister accout', function* (t) {
                yield t.any(insertUser, {
                    username: info.username,
                    email: info.email,
                    password: hash,
                    phone: phone,
                    token_register: token
                })
                return yield t.one(getEmail, {
                    email: info.email
                })
            })
                .then(data => {
                    console.log('insert data success!')
                    // khi user đăng nhập thành công thì lưu thông tin của user vào trong session
                    if (!req.session.user) req.session.user = data
                    nodeMail(email, subject, text)
                    res.redirect('/tai-khoan-cua-toi')
                })
                .catch(err => {
                    console.error(err.message)
                })
        })

    })
    router.post('/login', (req, res, next) => {
        // https://stackoverflow.com/questions/22858699/nodejs-and-passportjs-redirect-middleware-after-passport-authenticate-not-being
        
        passport.authenticate('login', (err, user, info) => {
            const url = req.session.url

            if (err) return next(err)
            // Redirect if it fails
            if (!user) {
                // if(!res.locals.login_err) {
                //     res.locals.login_err = req.session.flash.message.pop()
                // }
                return res.json(req.session.flash.message.pop())
            }

            req.logIn(user, (err) => {
                if (err) return next(err)
                // Redirect if it succeeds
                return res.redirect(url)
            })
        })(req, res, next)
    })

    router.get('/confirmation/:token_register', (req, res) => {
        const token_register = req.params.token_register
        const tokenRegistered = 'UPDATE customer SET verify_token_register = ${verify_token_register} WHERE token_register = ${token_register}'
        const veryfiToken = 'SELECT verify_token_register, email FROM customer WHERE token_register = ${token_register}'

        db.task('user veryfi account', function* (t) {
            yield t.any(tokenRegistered, {
                verify_token_register: token_register,
                token_register: token_register
            })

            return yield t.one(veryfiToken, {
                token_register: token_register
            })
        })
            .then(data => {
                if (!req.session.verify_token_register) {
                    req.session.email = data.email
                    req.session.verify_token_register = data.verify_token_register
                    res.redirect('/tai-khoan-cua-toi')
                }
            })
            .catch(err => {
                res.send('veryfi fail!')
            })
    })

    router.get('/tai-khoan-cua-toi', (req, res) => {
        console.log(req.session)
        const info = req.session
        const passportInfo = req.user
        const message = (info.verify_token_register) ? true : 'Một email đã được gửi đến hòm thư của bạn. Bạn vui lòng xác thực để hoàn thành quá trình đăng kí.!'
        const getInfoUser = 'SELECT username, email, phone FROM customer WHERE email=${email}'
        // const email = passportInfo.email || info.email 
        let email
        if (info.user) email = info.user.email
        if (passportInfo) email = passportInfo.email
        if(!req.session.message) req.session.message = message
        console.log('message', message)
        if(email) {
            db.one(getInfoUser, {
                email: email
            })
                .then(data => {
                    // console.log(data)
                    res.render(frontendPath + 'Shop/user-account', {
                        info: data,
                        message: message
                    })
                })
        } else {
            res.redirect('/')
        }
    })

    router.post('/updateInfo', (req, res) => {

    })

    router.get('/logout', (req, res) => {
        req.session.destroy()
        res.redirect('/')
    })
} 