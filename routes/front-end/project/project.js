/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/du-an', (req, res) => {
        res.render(frontendPath + 'Project/project', {
            title: 'Dự án'
        })
    })
}