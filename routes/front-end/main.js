/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    /***
     * All router of front end pages
     */
    const homeRouter = require('./home/home').homePage
    const shopRouter = require('./shop/shop').shopPage
    const userRouter = require('./user/user').userInfo

    class FrontEnd {
        constructor(_db, _router,_frontendPath) {
            this.db = _db
            this.router = _router
            this.frontendPath = _frontendPath
        }

        getHome () {
            homeRouter(this.db, this.router, this.frontendPath)
        }

        getShop () {
            shopRouter(this.db, this.router, this.frontendPath)
        }

        getUser () {
            userRouter(this.db, this.router, this.frontendPath)
        }
    }
    const routerMain = new FrontEnd(db, router, frontendPath)
    routerMain.getHome()
    routerMain.getShop()
    routerMain.getUser()
}