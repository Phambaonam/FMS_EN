module.exports = function (router, backendPath, db, upload) {
    const fs = require('fs')
    const getAlias = require('../getAlias').getAlias
    const removeimages = function (imagesDelete) {
        const pathImg = '/home/doremonsun/Desktop/DoAn/FMS_EN/public/images/products/'
        for(let image in imagesDelete) {
            fs.unlink(pathImg + imagesDelete[image], (err) => {
                if (err) {
                    console.log('failed to delete local image:'+ err)
                } else {
                    console.log('successfully deleted local image ' + imagesDelete[image])                                
                }
            })
        }
    }
    router.get('/admin/product', (req, res) => {
        db.task('get data' , function * (t) {
            const allProducts = 'SELECT ap.id AS attribute_product_id, ap.rest_of_product, pr.ucp, pr.product_name, pr.id AS product_id, cp.name_category_product, ap.total ,pp.product_price, pp.original_price , pp.time_create FROM product AS pr JOIN category_product AS cp ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id;'
            return yield t.any(allProducts)       
        })
            .then(data => {
                // res.json(data)
                res.render(backendPath + 'product/product', {
                    products: data
                })
            })

    })
    router.get('/admin/product/product_detail/:id', (req, res) => {
        const attribute_product_id = req.params.id
        db.task('get data' , function * (t) {
            const product = 'SELECT ap.id AS attribute_product_id, pr.ucp, pr.product_name, pr.description, ap.images ,cp.name_category_product, ap.rest_of_product, ap.attributes ,pp.product_price, pp.original_price, pp.sale_off_price , pp.time_create FROM product AS pr JOIN category_product AS cp ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ap.id = ${attribute_product_id};'
            return yield t.any(product, {
                attribute_product_id : attribute_product_id
            })       
        })
            .then(data => {
                // res.json(data)
                res.render(backendPath + 'product/product_detail', {
                    data: data  
                })
            })
       
    })
    router.get('/admin/product/add_product', (req, res) => {
        db.task('get category product', function * (t) {
            const dataCategoryproduct = 'SELECT id, name_category_product FROM category_product;'
            return yield t.any(dataCategoryproduct)
        })
            .then(data => {
                res.render(backendPath + 'product/add_product', {
                    categoryProducts: data
                })
            })
    })
    router.post('/admin/product/add_product',upload.array('photos', 10), (req, res) => {
        const info = req.body
        const photos = req.files

        let images = {}
        for(let photo in photos) {
            images[photo] = photos[photo].filename
        }

        let optionStatus = {}
        optionStatus['status_product'] = info.status_product
        optionStatus['sale_off_price'] = info.sale_off_price
        optionStatus['new_product'] = info.new_product

        let attributes = {}
        attributes['material'] = info.material
        attributes['color'] = info.color
        attributes['manufacturer'] = info.manufacturer
        attributes['status_product'] = info.status_product
        let size = attributes['size'] = {}
        size['length'] = info.length
        size['width'] = info.width
        size['hight'] = info.hight
        size['diameter'] = info.diameter

        db.task(' insert data of product ', function * (t) {
            /**
             * Nếu sản phẩm chưa có thì thêm sản phẩm mới vào bảng product.
             * Nếu cùng sản phẩm nhưng khác thuộc tính thì ko thêm vào bảng product mà chuyển sang bảng attribute_product
             */
            if(info.product_name) {
                const idCategoryProduct = 'SELECT id FROM category_product AS cp WHERE cp.name_category_product = ${name_category_product} '
                const getICategoryProduct = yield t.one(idCategoryProduct, {
                    name_category_product: info.name_category
                })
                const dataProduct = 'INSERT INTO product (ucp,product_name,description,product_alias,category_product_id)' + 
                                    'VALUES (${ucp},${product_name}, ${description}, ${product_alias}, ${category_product_id});'
                yield t.any(dataProduct, {
                    ucp: info.ucp_product,
                    product_name: info.product_name,
                    description: info.description,
                    product_alias: getAlias(info.product_name),
                    category_product_id: getICategoryProduct.id
                })                      
            }
            /**
             *  Dù là sản phẩm có thuộc tính khác nhau hay không có thì đều thêm vào bảng attribute_product
             */
            const idProduct = 'SELECT id FROM product WHERE ucp = ${ucp};'
            const getIdproduct = yield t.one(idProduct, {
                ucp: info.ucp_product
            })

            const attributeProduct = 'INSERT INTO attribute_product (images,attributes,option_status,total,rest_of_product,product_id)' +
                                     'VALUES (${images},${attributes}, ${option_status}, ${total}, ${rest_of_product}, ${product_id});'
            yield t.any(attributeProduct, {
                images: images,
                attributes: attributes,
                option_status: optionStatus,
                total: info.total,
                rest_of_product: info.total,
                product_id: getIdproduct.id
            })
            
            /**
             * Nếu sản phẩm có nhiều thuộc tính khác nhau thì dữ liệu thêm bào bảng productPrice sẽ lấy giá trị dc thêm gần nhất ở bảng attribute_product.
             * Nếu sản phẩm là duy nhất thì cứ lấy bình thường. 
             */
            let attribute_product_id
            if (!info.product_same) {
                const idAttributeProduct = 'SELECT ap.id FROM product AS pr JOIN attribute_product  AS ap ON pr.id =  ap.product_id WHERE ap.product_id  = ${product_id};'
                const getIdAttributeProduct = yield t.one(idAttributeProduct, {
                    product_id: getIdproduct.id
                })
                attribute_product_id = getIdAttributeProduct.id
            } else {
                const idAttributeProduct = 'SELECT ap.id FROM product AS pr JOIN attribute_product  AS ap ON pr.id =  ap.product_id WHERE ap.product_id  = ${product_id} ORDER BY ap.id DESC LIMIT 1;'
                const getIdAttributeProduct = yield t.one(idAttributeProduct, {
                    product_id: getIdproduct.id
                })
                attribute_product_id = getIdAttributeProduct.id
            }
           
            // return getIdAttributeProduct.id     
            const productPrice = 'INSERT INTO product_price (product_price,original_price,sale_off_price,time_create,attribute_product_id)' +
                                 'VALUES (${product_price}, ${original_price}, ${sale_off_price}, ${time_create}, ${attribute_product_id});'
            yield t.any(productPrice, {
                product_price: parseFloat(info.product_price),
                original_price: parseFloat(info.original_price),
                sale_off_price: parseFloat(info.sale_out_price),
                time_create: info.time_create,
                attribute_product_id: attribute_product_id
            })                        
        })
            .then(() => {
                res.redirect('/admin/product')
            })
    })

    router.get('/admin/product/product_edit/:id', (req, res) => {
        const attribute_product_id = req.params.id
        db.task('', function * (t) {
            const dataCategoryProduct = 'SELECT id, name_category_product FROM category_product;'
            const getDataCategoryProduct = yield t.any(dataCategoryProduct)
            const product = 'SELECT ap.id AS attribute_product_id, ap.images, ap.option_status, ap.total, ap.attributes, pr.id AS product_id, pr.ucp, pr.product_name, pr.description, cp.name_category_product, pp.id AS product_price_id ,pp.product_price, pp.original_price, pp.sale_off_price , pp.time_create FROM product AS pr JOIN category_product AS cp ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ap.id = ${attribute_product_id};'
            const getDataProduct = yield t.any(product, {
                attribute_product_id : attribute_product_id
            })
            return {
                datCategoryProduct: getDataCategoryProduct,
                dataProduct: getDataProduct,
                images: JSON.stringify(getDataProduct[0].images)
            }
        })
            .then(data => {
                // res.json(data)
                res.render(backendPath + 'product/product_edit', {
                    data:data
                })
            })
    })
    
    router.post('/admin/product/update_product',upload.array('photos', 10), (req,res) => {
        const info = req.body
        const photos = req.files

        let images = {}
        for(let photo in photos) {
            images[photo] = photos[photo].filename
        }

        let optionStatus = {}
        optionStatus['status_product'] = info.status_product
        optionStatus['sale_off_price'] = info.sale_off_price
        optionStatus['new_product'] = info.new_product

        let attributes = {}
        attributes['material'] = info.material
        attributes['color'] = info.color
        attributes['manufacturer'] = info.manufacturer
        attributes['status_product'] = info.status_product
        let size = attributes['size'] = {}
        size['length'] = info.length
        size['width'] = info.width
        size['hight'] = info.hight
        size['diameter'] = info.diameter


        db.task('update data product', function * (t) {
            const imagesDelete = JSON.parse(req.body.imageDelete)
            removeimages(imagesDelete)
            const tableProduct = 'UPDATE product SET ucp = ${ucp_product}, product_name = ${product_name}, description = ${description} WHERE id = ${product_id};'
            yield t.any(tableProduct, {
                ucp_product: info.ucp_product,
                product_name: info.product_name,
                description: info.description,
                product_id: parseInt(info.product_id)
            })

            const tableAttributeProduct = 'UPDATE attribute_product SET  images = ${images}, attributes = ${attributes}, option_status = ${option_status}, total = ${total} WHERE id = ${attribute_product_id};'
            yield t.any(tableAttributeProduct, {
                images: images,
                attributes: attributes,
                option_status: optionStatus,
                total: info.total,
                attribute_product_id: parseInt(info.attribute_product_id)
            })

            const tableProductPrice = 'UPDATE product_price SET product_price = ${product_price}, original_price = ${original_price}, sale_off_price =${sale_off_price}, time_create = ${time_create} WHERE id = ${product_price_id};'
            yield t.any(tableProductPrice, {
                product_price: info.product_price,
                original_price: info.original_price,
                sale_off_price: info.sale_out_price,
                time_create: info.time_create,
                product_price_id: parseInt(info.product_price_id)
            })
        })
            .then(() => {
                res.redirect('/admin/product')
            })
    })

    router.get('/admin/product/product_remove/:attribute_product_id/:product_id', (req, res) => {
        const info = req.params

        db.task('remove product', function * (t) {
            const attribute_product_id = 'SELECT id FROM attribute_product WHERE product_id = ${product_id};'
            const get_attribute_product_id =  yield t.any(attribute_product_id, {
                product_id: info.product_id
            })
            const images = 'SELECT images FROM attribute_product WHERE id = ${attribute_product_id};'
            const getImages = yield t.one(images, {
                attribute_product_id: info.attribute_product_id
            })
            removeimages(getImages.images)

            if(get_attribute_product_id.length > 1) {
                const removeProduct = 'DELETE FROM attribute_product WHERE id = ${attribute_product_id};'
                yield t.any(removeProduct, {
                    attribute_product_id: info.attribute_product_id
                })
            } else {
                const removeProduct = 'DELETE FROM product WHERE id = ${product_id}'
                yield t.any(removeProduct, {
                    product_id: info.product_id
                })
            }
        })
            .then((data) => {
                console.log('the product deleted')
                res.redirect('/admin/product')
            })
    })
} 