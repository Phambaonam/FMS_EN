/**
 * Created by namdoremon on 8/3/17.
 */
module.exports.shopPage = function (db, router, frontendPath) {

    let menu = () => {
        return db.task('get menu', function* (t) {
            /**
            * All side bar left 
            */
            let menuArea = []
            let menuCategory = []

            /**
             *  menu left category product depended on area
             */
            const areas = 'SELECT * FROM area AS ar;'
            const areasData = yield t.any(areas)
            /**
             *  Quản lý menu theo 2 cách:
             *  Nếu tất cả category child thuộc 1 category xuất hiện ở nhiều khu vực thì sub menu sẽ hiển thị theo tên của category cha (tránh category child lặp lại nhiều lần).
             *  Nếu 1 vài category child có ở khu vực này mà không có ở khu vực khác thì sub menu sẽ hiển thị theo tên của category child.
             * Cách thực hiện:
             *      - Nếu hiển thị theo category cha thì xét diều kiện gộp(group by category id) cho category child là true, còn theo category child thì là false.
             *      - Tìm category tương ứng từng khu vực. 
             */
            for (let area in areasData) {
                let temp = 0
                let count = 0
                const getStatus = 'SELECT cp.group_by_category, cp.category_id, ca.name_category FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id ORDER BY cp.category_id ASC;'
                const status = yield t.any(getStatus)
                let category_product = []
                for (let check in status) {
                    /**
                     * Kiểm tra nếu category child được gộp vào 1 nhóm thì submenu là category cha.
                     * Do nhiều category child thuộc 1 category cha nên tạo ra biến:
                     *      temp: dùng để check khi nào sẽ chuyển 1 category child khác.
                     *      count: dùng để kiểm tra nếu category child là phần tử cuối cùng của 1 category cha thì sẽ lấy category cha.
                     */
                    if (status[check].group_by_category && status[check].category_id != temp) {
                        temp = status[check].category_id
                        const countCategoryId = 'SELECT COUNT(cp.category_id)  FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id  WHERE cp.category_id = ${category_id};'
                        const dem = yield t.any(countCategoryId, {
                            category_id: temp
                        })
                        count = parseInt(dem[0].count)
                        count--
                    }
                    // Kiểm tra category child trước đó và tiếp theo có cùng category cha hay không, nếu cùng category cha thì giảm count cho tới khi count = 0
                    else if (status[check].group_by_category && temp === status[check].category_id)
                        count--

                    /**
                     *   Kiểm tra xem category child có thuộc khu vực đó không và chỉ lấy category child nằm trong khu vực đó.
                     *   Dùng console.log(typeof categoryProductData[0])  để lấy đúng dữ liệu.
                     */
                    if (status[check].group_by_category && count === 0) {
                        const name_category = 'SELECT ca.id AS category_id, ca.name_category AS name_category_product, ca.category_alias AS category_product_alias FROM category AS ca JOIN  category_product AS cp ON ca.id = cp.category_id WHERE ${area} = ANY (areas) AND cp.category_id = ${category_id} LIMIT 1;'
                        const categoryProductData = yield t.any(name_category, {
                            area: areasData[area].area_name,
                            category_id: temp
                        })
                        // Nếu category child không nằm trong khu vực thì data trả về sẽ là underfined
                        // console.log(typeof categoryProductData[0])
                        if (typeof categoryProductData[0] === 'object') {
                            category_product.push(categoryProductData[0])
                        }
                    }

                    /**
                     *  Kiểm tra nếu category child không được gộp vào 1 nhóm thì submenu là category child.
                     *  Dùng console.log(typeof categoryProductData[0]) để lấy đúng dữ liệu.
                     */
                    else if (!status[check].group_by_category && status[check].category_id != temp) {
                        temp = status[check].category_id
                        const name_category = 'SELECT cp.id AS category_product_id, cp.name_category_product, cp.category_product_alias, cp.group_by_category FROM category_product AS cp JOIN category AS ca ON ca.id = cp.category_id WHERE ${area}= ANY (areas) AND cp.category_id = ${category_id};'
                        const categoryProductData = yield t.any(name_category, {
                            area: areasData[area].area_name,
                            category_id: temp
                        })
                        // Nếu category child không nằm trong khu vực thì data trả về sẽ là underfined  
                        // console.log(typeof categoryProductData[0])                     
                        if (typeof categoryProductData[0] === 'object')
                            category_product.push(categoryProductData[0])
                    }

                }
                // trả về submeu và area sau khi kiểm tra
                menuArea.push({
                    area_name: areasData[area].area_name,
                    area_alias: areasData[area].area_alias,
                    category_product: category_product
                })
            }

            /**
             *  menu left category product depended on category
             *  Lấy tất cả các category child 
             */
            const categories = 'SELECT ca.name_category, ca.category_alias FROM category AS ca;'
            const categoriesData = yield t.any(categories)
            for (let category in categoriesData) {
                const categoryId = 'SELECT ca.id FROM category AS ca WHERE name_category = ${name_category};'
                const categoryIdData = yield t.any(categoryId, {
                    name_category: categoriesData[category].name_category
                })
                const category_product = 'SELECT cp.id AS category_product_id, cp.name_category_product, cp.category_product_alias FROM category_product AS cp WHERE category_id = ${category_id};'
                const categoryProductData = yield t.any(category_product, {
                    category_id: categoryIdData[0].id
                })
                menuCategory.push({
                    name_category: categoriesData[category].name_category,
                    category_alias: categoriesData[category].category_alias,
                    category_product: categoryProductData
                })

            }
            
            let removeDuplicates =  (myArr, prop) => {
                return myArr.filter((obj, pos, arr) => {
                    return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
                })
            }
            const author = "SELECT attributes -> 'manufacturer'AS author FROM attribute_product"
            const getAuthors = yield t.any(author)

            const material = "SELECT attributes -> 'material' AS material FROM attribute_product"
            const getMaterial = yield t.any(material)
            // console.log([...new Set(getAuthors)])
            return [menuArea, menuCategory, removeDuplicates(getAuthors, 'author'), removeDuplicates(getMaterial, 'material')] // [...new Set(getAuthors)]
        })
    }

    router.get('/san-pham', (req, res) => {
        db.task('getAllproduct', function* (t) {
            // Get all products
            const products = `
            SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.id AS product_id , 
            ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr
            JOIN attribute_product AS ap ON ap.product_id = pr.id
            JOIN product_price AS pp ON pp.attribute_product_id = ap.id;`
            const getDataAllProducts = yield t.any(products)
            return menu().then(data => {
                return {
                    menuArea: data[0],
                    menuCategory: data[1],
                    authors: data[2],
                    materials: data[3],
                    products: getDataAllProducts,
                    url: req.url
                }
            })

        })
            .then(data => {
                // res.json(data)
                if (req.session.url !== req.url) req.session.url = req.url
                /**
                 * Khi user đăng kí thì thông tin của user được lưu trong session
                 * Khi user đăng nhập thì thông tin của user được lưu  trong req.user
                 */
                // if (req.user) console.log('user dang nhap thanh cong', req.user)
                // if (req.session.user) console.log('user dang ki thanh cong', req.session.user)
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/shop', {
                    info: info,
                    data: data,
                    title: 'Sản phẩm'
                })
            })
    })

    router.get('/san-pham/:param', (req, res) => {
        const info = req.params
        db.task('get product', function* (t) {
            const id_category_product = 'SELECT id AS category_product_id FROM category_product WHERE category_product_alias = ${category_product_alias};'
            const get_id_category_product = yield t.one(id_category_product, {
                category_product_alias: info.param
            })

            const products = 'SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.id AS product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE pr.category_product_id = ${category_product_id};'
            const getDataAllProducts = yield t.any(products, {
                category_product_id: get_id_category_product.category_product_id
            })

            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        products: getDataAllProducts,
                        authors: data[2],
                        materials: data[3],
                        url: req.url.slice(1).split('/'),
                        category_product_id: get_id_category_product.category_product_id
                    }
                })
        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/shop', {
                    info: info,
                    data: data,
                    title: 'Sản phẩm'
                })
            })
    })

    router.get('/san-pham-group/:param', (req, res) => {
        const info = req.params
        db.task('get product', function* (t) {
            const id_category = 'SELECT id AS category_id FROM category WHERE category_alias = ${category_alias};'
            const getIdCategory = yield t.one(id_category, {
                category_alias: info.param
            })

            const products = 'SELECT cp.category_id, pr.product_name, pr.product_alias, ap.id AS product_id, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id JOIN product AS pr ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id};'
            const getDataAllProducts = yield t.any(products, {
                category_id: getIdCategory.category_id
            })
            return menu().then(data => {
                return {
                    menuArea: data[0],
                    menuCategory: data[1],
                    authors: data[2],
                    materials: data[3],
                    products: getDataAllProducts,
                    url: req.url.slice(1).split('/'),
                    category_id: getIdCategory.category_id
                }
            })
        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/shop', {
                    info: info,
                    data: data,
                    title: 'Sản phẩm'
                })
            })
    })

    router.post('/sort/products', (req, res) => {
        const info = req.body
        let condition = info.data
        switch (condition) {
            case 'sort0':
                condition = 'ORDER BY pp.attribute_product_id ASC;'
                break
            case 'sort1':
                condition = "(option_status->'new_product') is not null;"
                break
            case 'sort2':
                condition = 'ORDER BY product_price ASC;'
                break
            case 'sort3':
                condition = 'ORDER BY product_price DESC;'
                break
            case 'sort6':
                condition = 'ORDER BY pp.attribute_product_id ASC;'
                break
            case 'price1':
                condition = ' AND pp.product_price < 1000000;'
                break
            case 'price2':
                condition = 'AND pp.product_price > 1000000 AND pp.product_price < 3000000;'
                break
            case 'price3':
                condition = 'AND pp.product_price > 3000000 AND pp.product_price < 5000000;'
                break
            case 'price4':
                condition = 'AND pp.product_price > 5000000 AND pp.product_price < 10000000;'
                break
            case 'price5':
                condition = 'AND pp.product_price > 10000000;'
                break                    
        }

        db.task('sort product', function* (t) {
            let products
            let url = info.path
            switch (url) {

                case 'san-pham-group':
                    {
                        const products1 = 'SELECT cp.category_id, pr.product_name, pr.product_alias, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id JOIN product AS pr ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id} ' + condition
                        const products3 = 'SELECT cp.category_id, pr.product_name, pr.product_alias, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id JOIN product AS pr ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id} AND ' + condition
                        products = condition !== "(option_status->'new_product') is not null;" ? products1 : products3

                        const getDataAllProducts = yield t.any(products, {
                            category_id: parseInt(info.category_product)
                        })

                        return {
                            products: getDataAllProducts
                        }
                    }

                case 'san-pham':
                    {
                        const products1 = 'SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE pr.category_product_id = ${category_product_id} ' + condition
                        const products3 = 'SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE pr.category_product_id = ${category_product_id} AND ' + condition
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3

                        const getDataAllProducts = yield t.any(products, {
                            category_product_id: parseInt(info.category_product)
                        })
                        return {
                            products: getDataAllProducts
                        }
                    }

                case '/':
                    {
                        const products1 = `
                SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id  ${condition}`
                        const products3 = `
                SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE ${condition}`

                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3

                        const getDataAllProducts = yield t.any(products)
                        return {
                            products: getDataAllProducts
                        }
                    }
                
                case 'tac-gia':
                    {
                        const products1 = "SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'manufacturer' ? ${author}" + condition
                        const products3 = "SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'manufacturer' ? ${author} AND " + condition
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3
                        const getDataAllProducts = yield t.any(products, {
                            author: info.author
                        })

                        return {
                            products: getDataAllProducts
                        }
                    }
                    
                case 'chat-lieu':
                    {
                        const products1 = "SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'material' ? ${material}" + condition
                        const products3 = "SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'material' ? ${material} AND " + condition
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3
                        const getDataAllProducts = yield t.any(products, {
                            material: info.material
                        })

                        return {
                            products: getDataAllProducts
                        }
                    }    
            }
        })
            .then(data => {
                res.render(frontendPath + 'Shop/product', { data: data })
            })
    })

    router.get('/san-pham/tac-gia/:author', (req, res) => {
        const author = req.params.author.replace(/-/g, ' ')
        db.task('get product of author', function* (t) {
            const products = "SELECT ap.id AS product_id , pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE (attributes->'manufacturer') ? ${author};"
            const getProducts = yield t.any(products, {
                author: author
            })
            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: getProducts,
                        url: req.url.slice(1).split('/')[1],
                        author: author
                    }
                })
        })
            .then(data => {
                // res.json(data)
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/shop', {
                    info: info,
                    data: data,
                    title: 'Sản phẩm'
                })
            })
    })

    router.get('/san-pham/chat-lieu/:material', (req, res) => {
        const material = req.params.material.replace(/-/g, ' ')
        db.task('get product of author', function* (t) {
            const products = "SELECT ap.id AS product_id , pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE (attributes->'material') ? ${material};"
            const getProducts = yield t.any(products, {
                material: material
            })
            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: getProducts,
                        url: req.url.slice(1).split('/')[1],
                        material: material
                    }
                })
        })
            .then(data => {
                // res.json(data)
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/shop', {
                    info: info,
                    data: data,
                    title: 'Sản phẩm'
                })
            })
    })

    router.post('/add_to_cart', (req, res) => {
        console.log(req.session)
        const quantity = parseInt(req.body.quantity)
        const product_id = parseInt(req.body.product_id)
        const sessID = req.session.id
        /**
         * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
         * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
         * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
         */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)

        db.task('add product to cart', function* (t) {
            const status1 = 'SELECT count(1) FROM cart WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID};'
            const status2 = 'SELECT count(1) FROM cart WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const status = (!req.user) ? status1 : status2
            const productExistsIncart = yield t.one(status, {
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })

            switch (productExistsIncart.count) {
                case '0':
                    {
                        const cart = 'INSERT INTO cart(session_user_id,attribute_product_id,quantity,user_id,event_id,total) VALUES(${sessID}, ${product_id},${quantity},${user_id},null,null);'
                        yield t.any(cart, {
                            sessID: sessID,
                            product_id: product_id,
                            quantity: quantity,
                            user_id: user_id
                        })
                    }
                    break

                case '1':
                    {
                        const qty1 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = ${sessID};'
                        const qty2 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id =${user_id};'
                        const qty = (!req.user) ? qty1 : qty2
                        let getQuality = yield t.any(qty, {
                            product_id: product_id,
                            sessID: sessID,
                            user_id: user_id
                        })
                        const updateQuantity1 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID} ;'
                        const updateQuantity2 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND user_id =${user_id};'
                        const updateQuantity = (!req.user) ? updateQuantity1 : updateQuantity2
                        yield t.any(updateQuantity, {
                            quantity: parseInt(getQuality[0].quantity) + quantity,
                            product_id: product_id,
                            sessID: sessID,
                            user_id: user_id
                        })
                    }
                    break
            }

            const sum1 = 'SELECT SUM(quantity) FROM cart  WHERE session_user_id = ${sessID} ;'
            const sum2 = 'SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};'
            const sum = (!req.user) ? sum1 : sum2
            const getSum = yield t.one(sum, {
                sessID: sessID,
                user_id: user_id
            })
            // update total cart in session
            req.session.passport ? (req.session.passport.user.sumProduct = parseInt(getSum.sum)) : (req.session.sumProduct = parseInt(getSum.sum))
            return getSum.sum
        })
            .then(data => {
                /**
                 * Khi sử dụng axios : để gán 1 thuộc tính nào vào trong cookie ta phải trả lại cho client 1 dữ liệu nào đó.
                 * Khi đó ta mới gán thuộc tính vào session thành công
                 */
                res.send(data)
            })
            .catch(err => {
                console.log(err.message)
            })
    })

    router.get('/gio-hang', (req, res) => {
        const sessID = req.session.id
        /**
        * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
        * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
        * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
        */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)
        db.task('gio hang', function* (t) {
            const cartDetail = []
            const cart1 = 'SELECT attribute_product_id, quantity FROM cart WHERE session_user_id = ${session_user_id} AND user_id = ${user_id} ORDER BY id ASC;'
            const cart2 = 'SELECT attribute_product_id, quantity FROM cart WHERE  user_id = ${user_id} ORDER BY id ASC;'
            const cart = (!req.user) ? cart1 : cart2
            const getCarts = yield t.any(cart, {
                session_user_id: sessID,
                user_id: user_id
            })

            for (let item in getCarts) {
                const product = 'SELECT pr.product_name,pr.product_alias, pp.product_price, ap.id AS product_id, ap.images FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE ap.id = ${attribute_product_id};'
                const getProduct = yield t.one(product, {
                    attribute_product_id: getCarts[item].attribute_product_id
                })
                getProduct.quantity = getCarts[item].quantity
                cartDetail.push(getProduct)
            }


            const sum1 = 'SELECT SUM(quantity) FROM cart  WHERE session_user_id = ${sessID} AND user_id = ${user_id};'
            const sum2 = 'SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};'
            const sum = (!req.user) ? sum1 : sum2
            const getSum = yield t.one(sum, {
                sessID: sessID,
                user_id: user_id
            })
            if (req.session.sumProduct !== getSum.sum) req.session.sumProduct = getSum.sum
            return cartDetail
        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user

                res.render(frontendPath + 'Shop/Product/cart', {
                    title: 'Giỏ hàng',
                    products: data,
                    info: info
                })
            })
    })

    router.get('/decrease/qty/:product_id', (req, res) => {
        /**
        * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
        * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
        * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
        */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)
        const product_id = req.params.product_id
        const sessID = req.session.id
        db.task('decrease quantity product', function* (t) {
            const quantity1 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = ${sessID};'
            const quantity2 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const quantity = (!req.user) ? quantity1 : quantity2
            let getQuality = yield t.one(quantity, {
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })
            const updateQuantity1 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID};'
            const updateQuantity2 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const updateQuantity = (!req.user) ? updateQuantity1 : updateQuantity2
            yield t.any(updateQuantity, {
                quantity: parseInt(getQuality.quantity) - 1,
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })
            // update total cart in session
            req.session.passport ? (req.session.passport.user.sumProduct = parseInt(req.session.passport.user.sumProduct) - 1) : (req.session.sumProduct = parseInt(req.session.sumProduct) - 1)
        })
            .then(() => {
                console.log('đã giảm số lượng sản phẩm thành công!')
                req.session.passport ? (res.json(req.session.passport.user.sumProduct)) : (res.json(req.session.sumProduct))

            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
            })
    })

    router.get('/increase/qty/:product_id', (req, res) => {
        /**
        * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
        * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
        * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
        */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)
        const product_id = req.params.product_id
        const sessID = req.session.id
        db.task('increase quantity product', function* (t) {
            const quantity1 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = ${sessID};'
            const quantity2 = 'SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const quantity = (!req.user) ? quantity1 : quantity2
            let getQuality = yield t.one(quantity, {
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })
            const updateQuantity1 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID};'
            const updateQuantity2 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const updateQuantity = (!req.user) ? updateQuantity1 : updateQuantity2
            yield t.any(updateQuantity, {
                quantity: parseInt(getQuality.quantity) + 1,
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })

            // update total cart in session
            req.session.passport ? (req.session.passport.user.sumProduct = parseInt(req.session.passport.user.sumProduct) + 1) : (req.session.sumProduct = parseInt(req.session.sumProduct) + 1)
        })
            .then(() => {
                console.log('đã tăng số lượng sản phẩm thành công!')
                req.session.passport ? (res.json(req.session.passport)) : (res.json(req.session.sumProduct))

            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
            })
    })

    router.post('/delete/product', (req, res) => {
        const sessID = req.session.id
        const product_id = parseFloat(req.body.product_id)
        /**
        * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
        * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
        * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
        */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)
        db.task('delete product', function* (t) {
            const product1 = 'DELETE FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = ${sessID} ;'
            const product2 = 'DELETE FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const product = (!req.user) ? product1 : product2
            yield t.any(product, {
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })

            const cartProduct1 = 'SELECT SUM(quantity) FROM cart WHERE cart.session_user_id = ${sessID};'
            const cartProduct2 = 'SELECT SUM(quantity) FROM cart WHERE user_id = ${user_id}; '
            const cartProduct = (!req.user) ? cartProduct1 : cartProduct2
            const getCartproduct = yield t.one(cartProduct, {
                sessID: sessID,
                user_id: user_id
            })

            req.session.passport ? (req.session.passport.user.sumProduct = parseInt(getCartproduct.sum)) : (req.session.sumProduct = parseInt(getCartproduct.sum))
            return getCartproduct
        })
            .then(data => {
                console.log(`Còn lại  ${data.sum} sản phẩm trong giỏ hàng`)
                res.json(data.sum)
            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
            })
    })

    router.get('/empty-cart', (req, res) => {
        /**
        * user_id chỉ sử dụng cho user đăng nhập và đăng ký.
        * Khi user đăng nhập thì `user_id = parseInt(req.session.passport.user.id)`
        * Khi user đăng ký thì `user_id = parseInt(req.session.user.id)`
        */
        let user_id
        if (req.session.user) user_id = parseInt(req.session.user.id)
        if (req.session.passport) user_id = parseInt(req.session.passport.user.id)
        const sessID = req.session.id
        const emptyCart1 = 'DELETE FROM cart WHERE session_user_id = ${session_user_id};'
        const emptyCart2 = 'DELETE FROM cart WHERE user_id = ${user_id};'
        const emptyCart = (!req.user) ? emptyCart1 : emptyCart2

        db.result(emptyCart, {
            session_user_id: sessID,
            user_id: user_id
        })
            .then((result) => {
                req.session.passport ? (req.session.passport.user.sumProduct = 0) : (req.session.sumProduct = 0)
                res.redirect('/gio-hang')
                console.log(`đã xóa hết ${result.rowCount} sản phẩm trong giỏ hàng`)
            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
            })
    })

    // chi tiet san pham

    router.get('/san-pham/chi-tiet-san-pham/:product', (req, res) => {
        const product_id = parseInt(req.params.product.split('-').pop())
        const product_alias = req.params.product.slice(0, -2)
        db.task('chi tiet san pham', function* (t) {
            const product_detail = `
                SELECT ap.id AS product_id, pr.product_name, ca.name_category, ca.category_alias, cp.name_category_product, cp.group_by_category, cp.category_product_alias ,pr.product_alias, ap.option_status, pr.description, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price 
                FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id
                JOIN category_product AS cp ON cp.id = pr.category_product_id
                JOIN category AS ca ON cp.category_id = ca.id
                WHERE ap.id = ${product_id}
            `
            const getDataProductDetail = yield t.one(product_detail, {
                product_id: product_id
            })

            const count = 'SELECT COUNT(ap.id) AS sum_products FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id WHERE pr.product_alias = ${product_alias}'
            const count_product = yield t.one(count, {
                product_alias: product_alias
            })
            const images = 'SELECT ap.id AS product_id, ap.images, pr.product_alias FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id WHERE pr.product_alias = ${product_alias}'
            const getImages = yield t.any(images, {
                product_alias: product_alias
            })
            return [getDataProductDetail, count_product, getImages]
        })
            .then(data => {
                // res.json(data)
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user || req.session.user
                res.render(frontendPath + 'Shop/Product/shop-detail', {
                    title: 'Chi tiết sản phẩm',
                    data: data[0],
                    status: parseInt(data[1].sum_products),
                    images: data[2],
                    info: info
                })
            })

    })

    router.post('/add_to_wishlish', (req, res) => {
        const product_id = parseInt(req.body.product_id)
        console.log('aaaaaaaaaaaaaaaaaa', req.session.user)
        /**
         * Nếu user mới đăng kí thì customer_id sẽ được lấy ra từ `req.session`.
         * Nếu user đăng nhập thì customer_id sẽ được lấy ra từ `req.session.passport`.
         */
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('add to wishlish', function* (t) {
            const status = 'SELECT count(1) FROM wishlish WHERE attribute_product_id = ${product_id} AND customer_id = ${customer_id};'
            const wishlishExist = yield t.one(status, {
                product_id: product_id,
                customer_id: customer_id
            })
            switch (wishlishExist.count) {
                case '0':
                    {
                        const insertWishlish = 'INSERT INTO wishlish(attribute_product_id, customer_id) VALUES (${product_id}, ${customer_id});'
                        yield t.any(insertWishlish, {
                            product_id: product_id,
                            customer_id: customer_id
                        })
                        req.flash('wishlish', 'Đã thêm sản phẩm vào danh sách yêu thích.')
                    }
                    break
                case '1':
                    req.flash('wishlish', ' Bạn đã thêm sản phẩm vào danh sách yêu thích.')
                    break
            }
            const countWishlish = 'SELECT COUNT(attribute_product_id) FROM wishlish WHERE customer_id = ${customer_id}'
            const getCountWishlish = yield t.one(countWishlish, {
                customer_id: customer_id
            })
            /**
            * Khi sử dụng axios : để gán 1 thuộc tính nào vào trong cookie ta phải trả lại cho client 1 dữ liệu nào đó.
            * Khi đó ta mới gán thuộc tính vào session thành công
            */
            // update total wishlish in session
            if (req.session.passport) req.session.passport.user.sumWishlish = parseInt(getCountWishlish.count)
            return getCountWishlish.count
        })
            .then(data => {
                res.json(data)
            })
    })

    router.post('/delete/wishlish', (req, res) => {
        const product_id = parseInt(req.body.product_id)
        const customer_id = parseInt(req.session.passport.user.id)
        db.task('remove wishlish product', function* (t) {
            const wishlish = 'DELETE FROM wishlish WHERE attribute_product_id = ${product_id} AND customer_id = ${customer_id} ;'
            yield t.any(wishlish, {
                product_id: product_id,
                customer_id: customer_id
            })
            const countWishlish = 'SELECT COUNT(attribute_product_id) FROM wishlish WHERE customer_id = ${customer_id}'
            const getCountWishlish = yield t.one(countWishlish, {
                customer_id: customer_id
            })

            if(req.session.passport) req.session.passport.user.sumWishlish = parseInt(getCountWishlish.count)
            return getCountWishlish.count
        })
            .then(data => {
                res.json(data)
            })
    })

    router.get('/yeu-thich', (req, res) => {
        /**
         * Nếu user mới đăng kí thì customer_id sẽ được lấy ra từ `req.session`.
         * Nếu user đăng nhập thì customer_id sẽ được lấy ra từ `req.session.passport`.
         */
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        let getWishlishProducts = []
        db.task('wishlish detail', function* (t) {
            const wishlish = 'SELECT attribute_product_id FROM wishlish WHERE  customer_id = ${customer_id} ORDER BY id ASC;'
            const getWishlishes = yield t.any(wishlish, {
                customer_id: customer_id
            })

            for (let item in getWishlishes) {
                const product = 'SELECT pr.product_name,pr.product_alias, pp.product_price, ap.id AS product_id, ap.images , ap.option_status FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE ap.id = ${attribute_product_id};'
                const getProduct = yield t.one(product, {
                    attribute_product_id: getWishlishes[item].attribute_product_id
                })
                getProduct.quantity = getWishlishes[item].quantity
                getWishlishProducts.push(getProduct)
            }
            return getWishlishProducts
        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user
                res.render(frontendPath + 'Shop/wishlist', {
                    title: 'Chi tiết sản phẩm',
                    info: info,
                    products: data
                })
            })

    })

    router.get('/so-dia-chi', (req, res) => {
        if (req.session.url !== req.url) req.session.url = req.url
        let info = req.user
        res.render(frontendPath + 'Shop/address', {
            title: 'Sổ địa chỉ',
            info: info
        })
    })

    router.get('/them-dia-chi', (req, res) => {
        if (req.session.url !== req.url) req.session.url = req.url
        let info = req.user
        res.render(frontendPath + 'Shop/add-address', {
            title: 'Sổ địa chỉ',
            info: info
        })
    })
    // payment

    router.get('/shipping', (req, res) => {
        res.render(frontendPath + 'Shop/Payment/shipping')
    })

    router.get('/thanh-toan', (req, res) => {
        res.render(frontendPath + 'Shop/Payment/payment')
    })

    router.get('/order-success', (req, res) => {
        res.render(frontendPath + 'Shop/Order/order-success')
    })

    router.get('/don-hang-cua-toi', (req, res) => {
        res.render(frontendPath + 'Shop/Order/order')
    })
}