/**
 * Created by doremonsun on 8/6/17.
 */
module.exports = function (db, router, frontendPath) {
    /***
     * All router of front end pages
     */
    const homeRouter = require('./home/home')
    const shopRouter = require('./shop/shop')
    const userRouter = require('./user/user')
    const projectRouter = require('./project/project')
    const collectionRouter = require('./collection/collection')
    const eventRouter = require('./event/event')
    const aboutRouter = require('./about/about')
    const blogRouter = require('./blog/blog')
    const contactRouter = require('./contact/contact')
    class FrontEnd {
        constructor(_db, _router, _frontendPath) {
            this.db = _db
            this.router = _router
            this.frontendPath = _frontendPath
        }

        getHome() {
            homeRouter(this.db, this.router, this.frontendPath)
        }

        getShop() {
            shopRouter(this.db, this.router, this.frontendPath)
        }

        getUser() {
            userRouter(this.db, this.router, this.frontendPath)
        }

        getProject() {
            projectRouter(this.db, this.router, this.frontendPath)
        }

        getCollection() {
            collectionRouter(this.db, this.router, this.frontendPath)
        }

        getEvent() {
            eventRouter(this.db, this.router, this.frontendPath)
        }

        getAbout() {
            aboutRouter(this.db, this.router, this.frontendPath)
        }

        getBlog() {
            blogRouter(this.db, this.router, this.frontendPath)
        }

        getContact() {
            contactRouter(this.db, this.router, this.frontendPath)
        }
    }
    const routerMain = new FrontEnd(db, router, frontendPath)
    routerMain.getHome()
    routerMain.getShop()
    routerMain.getUser()
    routerMain.getProject()
    routerMain.getCollection()
    routerMain.getEvent()
    routerMain.getAbout()
    routerMain.getBlog()
    routerMain.getContact()
}