module.exports = function (passport, Strategy, db) {
    const bcrypt = require('bcrypt')
    passport.use('login', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
        session: false
    }, (req, email, password, done) => {
        db.task('', function* (t) {
            const user = 'SELECT id, email, password FROM customer WHERE email = ${email};'
            const sum = 'SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};'
            const getUser = yield t.one(user, {
                email: email
            })
            const getSum = yield t.one(sum, {
                user_id: getUser.id
            })

            if (!getUser.sumProduct) getUser.sumProduct = getSum.sum
            return getUser
        })
            .then(data => {
                bcrypt.compare(password, data.password, (err, result) => {

                    if (err) return done(err)
                     
                    if (!result) return done(null, false, req.flash('message', 'Sai mật khẩu!'))
                    //  req.flash('message', 'Đăng nhập thành công!')
                    return done(null, data)
                })
            })
            .catch(err => {
                console.error(err.message)
                return done(null, false, req.flash('message', 'Tài khoản này không tồn tại!'))
            })
    }
    ))
}