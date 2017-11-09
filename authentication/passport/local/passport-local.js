module.exports = function (passport, Strategy, db) {
    const bcrypt = require('bcrypt')
    passport.use('login', new Strategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
        session: false
    }, (req, email, password, done) => {
        db.task('login with passport', function* (t) {
            const user = 'SELECT id, email, password FROM customer WHERE email = ${email};'
            const getUser = yield t.one(user, {
                email: email
            })

            const cart = 'SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};'
            const getCart = yield t.one(cart, {
                user_id: getUser.id
            })

            const wishlish = 'SELECT COUNT(attribute_product_id) FROM wishlish WHERE customer_id = ${customer_id};'
            const getWishlish = yield t.one(wishlish, {
                customer_id: getUser.id
            })

            // Khi người dùng đăng nhập thành công thì sẽ gán những thông tin cần thiết như tổng số sản phẩm có trong giỏ hàng 
            // và tổng sô sản phẩm yêu thích vào trong req.passport
            if (!getUser.sumProduct) getUser.sumProduct = getCart.sum
            if (!getUser.sumWishlish) getUser.sumWishlish = getWishlish.count
            // end 
            return getUser
        })
            .then(data => {
                console.log('data', data)
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