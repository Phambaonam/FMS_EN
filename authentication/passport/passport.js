module.exports = function (passport, db) {
    passport.serializeUser(function (data, cb) {
        // console.log('serializeUser', data.email)
        cb(null, data.email)
    })

    passport.deserializeUser(function (email, cb) {
        // console.log('deserializeUser', email)
        const getUser = 'SELECT * FROM customer WHERE email = ${email}'
        db.one(getUser, { email: email })
            .then(data => {
                cb(null, data)
            })
            .catch(err => {
                return cb(err)
            })
    })
}