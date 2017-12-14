/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/lien-he', (req, res) => {
        res.render(frontendPath + 'Contact/contact', {
            title: 'Liên hệ'
        })
    })
}