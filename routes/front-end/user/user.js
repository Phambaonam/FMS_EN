module.exports.userInfo = function (db, router, frontendPath) {
    const bcrypt = require('bcrypt')
    const saltRounds = 10
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

        const messageVerify = (req.session.verify_token_register) ? true : 'Một email đã được gửi đến hòm thư của bạn. Bạn vui lòng xác thực để hoàn thành quá trình đăng kí.!'
        const getInfoUser = 'SELECT username, email, phone, date_of_birth, general FROM customer WHERE email=${email}'

        let email = (req.session.passport) ? req.session.passport.user : req.session.user
        console.log('eamil', email)
        if (!req.session.messageVerify) req.session.messageVerify = messageVerify
        /**
         * User phải đăng nhập hoặc đăng kí thì mới cho vào trang tài khoản của tôi.
         * Nếu chưa thì sẽ cho về trang chủ.
         * Khi user update info thì cho `req.session.updateStatus = message`, nếu chỉ vào trang tài khoản của tôi thì 
         * để  `req.session.updateStatus = false`: user ko update info
         */
        if (email) {
            db.one(getInfoUser, {
                email: email.email
            })
                .then(data => {
                    // res.json(data)
                    if (!req.session.updateStatus) req.session.updateStatus = false

                    res.render(frontendPath + 'Shop/user-account', {
                        info: data,
                        messageVerify: messageVerify,
                        messageUpdateInfo: req.session.updateStatus
                    })
                    req.session.updateStatus = false
                })
        } else {
            res.redirect('/')
        }
    })

    router.post('/edit-info', (req, res) => {
        const email = req.body.new_email
        const password = req.body.password
        let user_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        if (email) {
            const updateEmail = 'UPDATE customer SET email = ${email} WHERE id = ${customer_id};'
            db.none(updateEmail, {
                email: email,
                customer_id: user_id
            })
            /**
             * Khi user lần đầu tiên update info thì chưa tồn tại `req.session.updateStatus`, sau khi upadte xong thì gán cho nó 1 message.
             * Các lần tiếp theo thì ta đã gán trạng thái cho nó là `fasle` ở router `/edit-info`
             */
            if (!req.session.updateStatus || req.session.updateStatus === false) req.session.updateStatus = 'Cập nhật thông tin thành công!'
            res.redirect('/tai-khoan-cua-toi')
        }

        if (password) {
            const updatePassword = 'UPDATE customer SET password = ${password} WHERE id = ${customer_id};'
            bcrypt.hash(password, saltRounds, (err, hash) => {
                db.none(updatePassword, {
                    password: hash,
                    customer_id: user_id
                })
            })
            if (!req.session.updateStatus || req.session.updateStatus === false) req.session.updateStatus = 'Cập nhật thông tin thành công!'
            res.json(true)
        }

        
    })

    router.post('/updateInfo', (req, res) => {
        const info = req.body
        let user_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('update info user', function* (t) {
            if (info.name) {
                const username = 'UPDATE customer SET username = ${username} WHERE id = ${customer_id};'
                yield t.any(username, {
                    username: info.name,
                    customer_id: user_id
                })
            }

            if (info.phone) {
                const phone = 'UPDATE customer SET phone = ${phone} WHERE id = ${customer_id};'
                yield t.any(phone, {
                    phone: info.phone,
                    customer_id: user_id
                })
            }

            if (info.date && info.month  && info.year) {
                const date_of_birth = 'UPDATE customer SET date_of_birth = ${date_of_birth} WHERE id = ${customer_id};'
                yield t.any(date_of_birth, {
                    date_of_birth: `${info.date.trim()}-${info.month.trim()}-${info.year.trim()}`,
                    customer_id: user_id
                })
            }
            if (info.gender) {
                const gender = 'UPDATE customer SET general = ${general} WHERE id = ${customer_id};'
                yield t.any(gender, {
                    general: info.gender.trim(),
                    customer_id: user_id
                })
            }
            return 1
        })
            .then(()=> {
                /*
                * Khi user lần đầu tiên update info thì chưa tồn tại `req.session.updateStatus`, sau khi upadte xong thì gán cho nó 1 message.
                * Các lần tiếp theo thì ta đã gán trạng thái cho nó là `fasle` ở router `/edit-info`
                */
                if (!req.session.updateStatus || req.session.updateStatus === false) req.session.updateStatus = 'Cập nhật thông tin thành công!'
                res.redirect('/tai-khoan-cua-toi')
            })
            .catch(err => {
                console.log(err.message)
            })
        
    })

    router.get('/logout', (req, res) => {
        req.session.destroy()
        res.redirect('/')
    })
} 