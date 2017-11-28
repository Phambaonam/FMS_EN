module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }
    
    router.get('/admin/login', (req, res) => {
        res.render(backendPath + 'login')
    })

    router.get('/admin/dashboard', checkUserLogin, (req, res) => {
        res.render(backendPath + 'index')
    })
}