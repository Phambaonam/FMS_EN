const product = function (multer, shortid ) {
    multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, '../../public/images/products/')
        },
        filename: function (req, file, cb) {
            if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
                cb(null, shortid.generate() + '_' + file.originalname)
            } else {
                console.log(file.mimetype)
            }
        }
    })
}

const user = function (multer, shortid ) {
    multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images/users/')
        },
        filename: function (req, file, cb) {
            if(file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
                cb(null, shortid.generate() + '_' + file.originalname)
            } else {
                console.log(file.mimetype)
            }
        }
    })
}

module.exports = {
    product: product,
    user: user
}