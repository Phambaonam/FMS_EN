/**
 * Created by doremonsun on 8/6/17.
 */
module.exports.routerAdmin = function (db, router, backendPath, upload) {
    const areaRouter = require('./categories/area')
    const categoryRouter = require('./categories/category')
    const categoryProductRouter = require('./categories/category_product')
    const productRouter = require('./product/product')
    const userRouter = require('./users/user')
    const dashboardRouter = require('./dashboard')
    const orderRouter = require('./orders/order')
    class BackEnd {
        constructor (_db, _router, _backendPath,_upload) {
            this.db = _db
            this.router = _router
            this.backendPath = _backendPath
            this.upload = _upload
        }

        getDashboard () {
            dashboardRouter(this.router, this.backendPath, this.db)
        }

        getArea () {
            areaRouter(this.router, this.backendPath, this.db)
        }

        getCategory () {
            categoryRouter(this.router, this.backendPath, this.db)
        }

        getCategoryProduct () {
            categoryProductRouter(this.router, this.backendPath, this.db)
        }

        getProduct () {
            productRouter(this.router, this.backendPath, this.db, this.upload)
        }

        getUser () {
            userRouter(this.router, this.backendPath, this.db)
        }

        getOrder () {
            orderRouter(this.router, this.backendPath, this.db)
        }
    }
    const routerMain = new BackEnd(db, router, backendPath, upload)
    routerMain.getDashboard()
    routerMain.getArea()
    routerMain.getCategory()
    routerMain.getCategoryProduct()
    routerMain.getProduct()
    routerMain.getUser()
    routerMain.getOrder()
}