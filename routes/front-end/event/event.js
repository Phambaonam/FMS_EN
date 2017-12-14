/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/event', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'Event/event', {
            info: info,
            title: 'Event'
        })
    })
}