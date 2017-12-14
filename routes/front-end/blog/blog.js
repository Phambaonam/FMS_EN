/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/blog', (req, res) => {
        res.render(frontendPath + 'Blog/blog', {
            title: 'Blog'
        })
    })
}