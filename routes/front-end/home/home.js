/**
 * Created by doremonsun on 8/6/17.
 */
module.exports.homePage = function (db, router ,frontendPath) {
    router.get('/', (req, res) => {
        if (req.session.url !== req.url) req.session.url = req.url
        if (!req.user) {
            res.render(frontendPath + 'Home/home', { title: 'Trang Chủ' })
        } else {
            res.render(frontendPath + 'Home/home', {
                info: req.user,
                title: 'Trang Chủ'
            })
        }
    })
}