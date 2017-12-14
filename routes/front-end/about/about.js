/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/about', (req, res) => {
        res.render(frontendPath + 'About/about', {
            title: 'Giới thiệu'
        })
    })
}