/**
 * Created by doremonsun on 8/6/17.
 */
module.exports.homePage = function (db, router, frontendPath) {
    router.get('/', (req, res) => {
        // console.log('req.user trang chu', req.user)
        // console.log('session trang chu', req.session)
        let data
        if (req.session.url !== req.url) req.session.url = req.url
        if (req.user) data = req.user
        if (req.session.user) data = req.session.user

        if (data) {
            res.render(frontendPath + 'Home/home', {
                info: data,
                title: 'Trang Chủ'
            })
        } else {
            res.render(frontendPath + 'Home/home', { title: 'Trang Chủ' })
        }
    })
}