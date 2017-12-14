/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/blog', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'Blog/blog', {
            info: info,
            title: 'Blog'
        })
    })
}