module.exports = function (passport, db) {
    passport.serializeUser(function (data, cb) {
        // console.log('serializeUser', data)
        cb(null, data)
    })

    passport.deserializeUser(function (data, cb) {
        // console.log('deserializeUser', data)
        const getUser = 'SELECT id, username, email,phone  FROM customer WHERE email = ${email}'
        db.one(getUser, { email: data.email })
            .then(result => {
                // if (!result.sumProduct) result.sumProduct = data.sumProduct
                cb(null, result)
            })
            .catch(err => {
                return cb(err)
            })
    })
}