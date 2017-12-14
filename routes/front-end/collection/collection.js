/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/bo-suu-tap', (req, res) => {
        let info = req.user || req.session.user
        res.render(frontendPath + 'Collection/collection', {
            info: info,
            title: 'Bộ sưu tập'
        })
    })
}