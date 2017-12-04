module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }

    router.get('/admin/payment_method', (req, res) => {
        const allMethods = 'SELECT id, name, time_create FROM payment_method  ORDER BY id DESC;'
        db.any(allMethods)
            .then(data => {
                res.render(backendPath + '/payment_method/method', {
                    methods: data
                })
            })
    })

    router.get('/admin/add_payment_method', (req, res) => {
        res.render(backendPath + '/payment_method/method_edit')
    })

    router.get('/admin/edit_payment_method', (req, res) => {
        res.render(backendPath + '/payment_method/method_edit')
    })

    router.post('/admin/payment_method', (req, res) => {
        const info = req.body
        const method = 'INSERT INTO payment_method(name, time_create) VALUES(${name}, ${time_create})'
        db.none(method, {
            name: info.method,
            time_create: info.time_create
        })
        res.redirect('/admin/payment_method')
    })
}