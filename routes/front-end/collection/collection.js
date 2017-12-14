/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    router.get('/bo-suu-tap', (req, res) => {
        res.render(frontendPath + 'Collection/collection', {
            title: 'Bộ sưu tập'
        })
    })
}