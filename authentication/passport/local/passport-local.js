module.exports = function (passport, Strategy, db) {
    const bcrypt = require('bcrypt')
    passport.use('login', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
        session: false
    }, (req, email, password, done) => {
        // console.log(email)
        const getUser = 'SELECT * FROM customer WHERE email = ${email};'
        db.one(getUser, { email: email })
            .then(data => {
                // console.log(data)
                bcrypt.compare(password, data.password, (err, result) => {

                    if (err) return done(err)
                    //  req.flash('message', 'Sai mật khẩu!')
                    if (!result) return done(null, false)
                    //  req.flash('message', 'Đăng nhập thành công!')
                    return done(null, data)
                })
            })
            .catch(err => {
                console.error(err.message)
                // req.flash('message', 'Tài khoản này không tồn tại!')
                return done(null, false)
            })
    }
    ))
}