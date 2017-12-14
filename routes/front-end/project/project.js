/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/du-an', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'Project/project', {
            info: info,
            title: 'Dự án'
        })
    })
}