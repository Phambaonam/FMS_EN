/**
 * Created by namdoremon on 8/2/17.
 */
const express = require('express')
const nunjucks = require('nunjucks')
const multer = require('multer')
const shortid = require('shortid')
const bodyParser = require('body-parser')
const session = require('express-session')
const morgan = require('morgan')
const fs = module.exports = require('fs')
const flash = require('connect-flash')
const passport = require('passport')
const Strategy = require('passport-local').Strategy

const app = express()
const router = express.Router()
const port = 3000
const db = require('./models/main')
const routerFrontEnd = require('./routes/front-end/main').routerFrontEnd
const frontendPath = 'front-end/pages/'
const routerBackEnd = require('./routes/back-end/main').routerAdmin
const backendPath = 'back-end/pages/'
const authentication = require('./authentication/passport/passport')
const passportLocal = require('./authentication/passport/local/passport-local')
// const uploadPhotos = require('./routes/reuse/uploadImages').product(multer, shortid)

const product = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/products/')
    },
    filename: function (req, file, cb) {
        if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
            cb(null, shortid.generate() + '_' + file.originalname)
        } else {
            console.log(file.mimetype)
        }
    }
})
console.log('server')
const uploadProduct = multer({ storage: product })

/***
 * https://expressjs.com/en/4x/api.html#app.use
 * app.use(): mounts the  specified middleware function or functions at the specified path.
 * express.static():  serves static files(sử dụng các file tĩnh trong ứng dụng)
 */
app.set('trust proxy', 1)
app.use(session({
    secret: 'FMS',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // cookie sẽ hết hạn trong 30 ngày
        secure: false
    }
}))

app.use(function (req, res, next) {
    /**
     * - Khi user đăng nhập thì sẽ gán giỏ hàng vào `req.session.passport` ở file `passport-local.js` và
     * update lại số lượng sản phẩm trong  giỏ hàng thông qua các router: `/decrease/qty`, `/increase/qty`, `/delete/product`, `/empty-cart`.
     * - Đối với user chưa đăng nhập thì sẽ gán giỏ hàng vào req.session ở bên router `/add_to_cart`
     */
    res.locals.carts = (req.session.passport) ? req.session.passport.user.sumProduct : req.session.sumProduct
    /**
     * Có 2 đối tượng:
     * - User đăng kí: 
     * - User đăng nhập:
     * + khi mới đăng nhập vào hệ thống thì danh sách sách các sản phẩm yêu thích sẽ dc lấy ra từ db và đc truyền vào `req.session.passport` ở file `passport-local.js`.
     * + Mỗi lần user thêm, xóa sản phẩm ở trong danh sách yêu thích thì sẽ update số lượng danh sách yêu thích ở trong router `/add_to_wishlish`, `/delete/wishlish`.
     */
    let customer_id
    if (req.session.passport) {
        res.locals.login_status = true
        res.locals.wishlish = req.session.passport.user.sumWishlish
        customer_id = parseInt(req.session.passport.user.id)
    }
    if (req.session.user) {
        res.locals.login_status = true
        res.locals.wishlish = 0
        customer_id = parseInt(req.session.user.id)
    }

    const listWishlish = 'SELECT attribute_product_id FROM wishlish WHERE customer_id = ${customer_id};'
    db.any(listWishlish, {
        customer_id: customer_id
    })
        .then(data => {
            data.length === 0 ? res.locals.listWishlish = 0 : res.locals.listWishlish = data
        })
    /**
     * Viết ở đây mục đích là để khi user vào những trang mà tài khoản bắt buộc phải xác thực, thì
     * ta chỉ phải viêt 1 lần trong midleware mà có thể dùng cho nhiều route
     */    
    const veryfiToken = 'SELECT verify_token_register FROM customer WHERE id = ${customer_id}'  
    db.one(veryfiToken , {
        customer_id: customer_id
    })
        .then(data => {
            res.locals.messageVerify = (data.verify_token_register !== null) ? true : 'Một email đã được gửi đến hòm thư của bạn. Bạn vui lòng xác thực để hoàn thành quá trình đăng kí!'
        })
        .catch(err => {
            console.log(`Kiểm tra xác thực tài khoàn ${err.message}`)
        })  
    // console.log('res.locals.login_status', res.locals.login_status)
    // console.log('res.locals.wishlish', res.locals.wishlish)
    // console.log('res.locals.carts', res.locals.carts)
    // console.log(`res.locals.carts ${res.locals.carts}`)
    // console.log('aaaaaaaaaaaaaa', req.session)
    next()
})

app.use('/public', express.static('public'))
app.use(bodyParser.urlencoded({
    extended: true
}))
// parse application/json
app.use(bodyParser.json())

/***
 * configure template engine nụnjucks
 */
nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: true,

})
/***
 * https://expressjs.com/en/4x/api.html#app.engine
 * Use this method, if you wish to 'map' a different extension to the template engine.
 * (Sử dụng method này nếu muốn sử dụng các extension template khác nhau)
 * With nunjucks, we use nunjucks.render(trong nunjucks thì sử dụng hàm nụnjucks.render)
 */
app.engine('html', nunjucks.render)
/***
 * https://expressjs.com/en/4x/api.html#app.set
 * The default engine extension to use when omitted.
 * (engine extension mà bạn sử dụng cho toàn bộ ứng dụng, có thể không cần viết đuôi file)
 */
app.set('view engine', 'html')
app.use(morgan('dev'))
app.use(passport.initialize())
app.use(passport.session())


passportLocal(passport, Strategy, db)
authentication(passport, db)
app.use(flash())
app.use(router)
/***
 * All routers
 */

routerFrontEnd(db, router, frontendPath)
routerBackEnd(db, router, backendPath, uploadProduct)

app.listen(process.env.PORT || port, function () {
    console.log(`server running on port ${port}!`)
})
