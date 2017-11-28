module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }

    router.get('/admin/users', checkUserLogin, (req, res) => {
        const getUser = "SELECT username, email, phone, general, time_register FROM customer WHERE role = '0';"
        db.any(getUser)
            .then(users => {
                res.render(backendPath + 'users/user', {
                    users: users
                })
            })
        
    })

    router.get('/admin/user-detail', checkUserLogin, (req, res) => {
        const user = req.query.user
        res.json(user)
    })

    router.get('/admin/administrators', checkUserLogin, (req, res) => {
        const administrators = "SELECT username, email, phone, general, time_register, role FROM customer WHERE role <> '0';"
        db.any(administrators)
            .then(users => {
                res.render(backendPath + 'users/administrators', {
                    users: users
                })
            })
    })
}