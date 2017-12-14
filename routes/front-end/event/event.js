/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/event', (req, res) => {
        res.render(frontendPath + 'Event/event', {
            title: 'Event'
        })
    })
}