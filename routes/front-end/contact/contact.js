/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/lien-he', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'Contact/contact', {
            info: info,
            title: 'Liên hệ'
        })
    })
}