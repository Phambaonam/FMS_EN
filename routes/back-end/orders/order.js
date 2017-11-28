module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }

    router.get('/admin/order', (req, res) => {
        res.render(backendPath + '/orders/order')
    })
}