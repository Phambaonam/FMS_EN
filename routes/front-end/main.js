/**
 * Created by doremonsun on 8/6/17.
 */
module.exports.routerFrontEnd = function (db, router, frontendPath) {
    /***
     * All router of front end pages
     */
    const home = require('./home/home').homePage
    const shop = require('./shop/shop').shopPage
    const user = require('./user/user').userInfo

    class FrontEnd {
        constructor(_db, _router,_frontendPath) {
            this.db = _db
            this.router = _router
            this.frontendPath = _frontendPath
        }

        home () {
            home(this.db, this.router, this.frontendPath)
        }

        shop () {
            shop(this.db, this.router, this.frontendPath)
        }

        user () {
            user(this.db, this.router, this.frontendPath)
        }
    }
    const routerMain = new FrontEnd(db, router, frontendPath)
    routerMain.home()
    routerMain.shop()
    routerMain.user()
}