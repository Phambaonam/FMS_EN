/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/about', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'About/about', {
            info: info,
            title: 'Giới thiệu'
        })
    })
}