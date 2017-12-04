module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }

    router.get('/admin/fee_transport', (req, res) => {
        const fee = 'SELECT * FROM fee_transport  ORDER BY id DESC;'
        db.any(fee)
            .then(data => {
                res.render(backendPath + '/transport/fee', {
                    fee: data
                })
            })
    })

    router.get('/admin/add_fee_transport', (req, res) => {
        res.render(backendPath + '/transport/add_edit')
    })

    router.get('/admin/edit_fee_transport', (req, res) => {
        res.render(backendPath + '/payment_method/method_edit')
    })

    router.post('/admin/fee_transport', (req, res) => {
        const info = req.body
        const fee = 'INSERT INTO fee_transport(amount_of_purchase, fee, time_create) VALUES(${amount_of_purchase}, ${fee}, ${time_create})'
        db.task('insert fee transport', function* (t) {
            yield t.any(fee, {
                amount_of_purchase: info.total_purchase,
                fee: info.fee.replace(/[.]/g, ''),
                time_create: info.time_create
            })
            return true
        })
            .then(() => {
                res.redirect('/admin/fee_transport')
            })        
    })
}