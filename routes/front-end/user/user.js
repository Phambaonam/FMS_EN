module.exports = function (db, router, frontendPath) {
    const bcrypt = require('bcryptjs')
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
        const text = `Xin chào ${username}. Đây là email xác thực đăng kí tài khoản của bạn. Bạn hãy click vào link để hoàn thành quá trình đăng ký: http://${req.headers.host}/confirmation/${token}`

        const currentdate = new Date().toLocaleString().split(' ')[0].split('-')
        const time_register = `${currentdate[2]}-${currentdate[1]}-${currentdate[0]}`
        console.log(currentdate)
        const insertUser = 'INSERT INTO customer(username,email,password,phone,date_of_birth,general,time_register,token_register,verify_token_register,role) VALUES (${username}, ${email}, ${password},${phone},null,null,${time_register},${token_register},null,0);'
        const getEmail = 'SELECT id, username, email, phone, general FROM customer WHERE email = ${email}'
       
        bcrypt.hash(info.password, saltRounds, (err, hash) => {
            db.task('user resgister accout', function* (t) {
                yield t.any(insertUser, {
                    username: info.username,
                    email: info.email,
                    password: hash,
                    phone: phone,
                    token_register: token,
                    time_register: time_register
                })
                return yield t.one(getEmail, {
                    email: info.email
                })
            })
                .then(data => {
                    console.log('insert data success!')
                    // khi user đăng ký thành công thì lưu thông tin của user vào trong session
                    if (!req.session.user) req.session.user = data
                    nodeMail(email, subject, text)
                    res.redirect('/tai-khoan-cua-toi')
                })
                .catch(err => {
                    console.error(err.message)
                })
        })

    })

    router.get('/resend/veryfi-email/:username', (req, res) => {
        const username = req.params.username
        const token = crypto.randomBytes(16).toString('hex')
        const subject = 'Xác thực tài khoản!'
        const text = `Xin chào ${username}. Đây là email xác thực đăng kí tài khoản của bạn. Bạn hãy click vào link để hoàn thành quá trình đăng ký: http://${req.headers.host}/confirmation/${token}`
        let email = (req.session.passport) ? req.session.passport.user : req.session.user
        /**
         * Khi user yêu cầu gửi lại email xác thực thì ta cần phải thay đổi token veryfi trong db.
         * Kiểm ra lại token veryfi xem token đã dc lưu vào trong db hay chưa?
         * Lưu thành công rồi mới gửi email xác thực. 
         */
        db.task('resend email veryfi account', function* (t) {
            const updateTokenVeryfi = 'UPDATE customer SET token_register = ${token_register} WHERE email = ${email}'
            yield t.any(updateTokenVeryfi, {
                token_register: token,
                email: email.email
            })
            const veryfiToken = 'SELECT token_register FROM customer WHERE email = ${email};'
            return yield t.one(veryfiToken, {
                email: email.email
            })
        })
            .then(data => {
                nodeMail(email.email, subject, text)
                res.redirect('/tai-khoan-cua-toi')
                console.log(`Token đã thay đổi là: ${data.token_register}`)
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
        const veryfiToken = 'SELECT verify_token_register FROM customer WHERE token_register = ${token_register}'
        /**
         * Trong trường hợp này sau khi user xác thực tài khoản, ta lại lấy ra token_veryfi mục đích là để
         * kiểm tra xem đã xác thực thành công hay chưa?
         */
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
                if (data) console.log('Xác thực thành công!')
                res.redirect('/tai-khoan-cua-toi')
            })
            .catch(err => {
                res.send('Xác thực không thành công!')
            })
    })

    router.get('/tai-khoan-cua-toi', (req, res) => {
        const getInfoUser = 'SELECT username, email, phone, date_of_birth, general FROM customer WHERE email=${email}'
        /**
         * email được lấy ra từ:
         * user đăng nhập thông qua `req.session.passport.user`.
         * user đăng kí thông qua `req.session.user`
         */
        let email = (req.session.passport) ? req.session.passport.user : req.session.user
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

            if (info.birthday) {
                const date_of_birth = 'UPDATE customer SET date_of_birth = ${date_of_birth} WHERE id = ${customer_id};'
                yield t.any(date_of_birth, {
                    date_of_birth: info.birthday,
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