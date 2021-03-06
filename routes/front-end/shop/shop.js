/**
 * Created by namdoremon on 8/3/17.
 */
module.exports = function (db, router, frontendPath) {
    /**
     * Each route can have one or more handler functions, which are executed when the route is matched.
     * Có những router phải xác nhận người dùng đã đăng nhập hay chưa mới tiếp tục dc sử lý.
     */
    const shortid = require('shortid')

    const menu = () => {
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

            let removeDuplicates = (myArr, prop) => {
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

    const checkUserLogin = (req, res, next) => (req.session.passport || req.session.user) ? next() : res.redirect('/')

    /*** Phần hiển thị sản phẩm ***/
    router.get('/san-pham', (req, res) => {
        db.task('getAllproduct', function* (t) {
            // Get all products
            let products = `
            SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.id AS product_id , 
            ap.images, ap.attributes, ap.rest_of_product, pp.original_price, pp.sale_off_price FROM attribute_product AS ap
            JOIN product AS pr ON ap.product_id = pr.id
            JOIN product_price AS pp ON pp.attribute_product_id = ap.id;`
            let getProducts = yield t.any(products)
            let result = []
            for (let item in getProducts) {
                let product = getProducts[item]
                let product_id = +product.product_id
                let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                if (!product.rate) product.rate = Math.round(rate)
                result.push(product)
            }
            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: result,
                        url: req.url
                    }
                })

        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                /**
                 * Khi user đăng kí thì thông tin của user được lưu trong session
                 * Khi user đăng nhập thì thông tin của user được lưu  trong req.user
                 */
                // if (req.user) console.log('user dang nhap thanh cong', req.user)
                // if (req.session.user) console.log('user dang ki thanh cong', req.session.user)
                // res.json(data)
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
        const category_product_alias = info.param
        db.task('get product', function* (t) {
            const id_category_product = `SELECT id AS category_product_id FROM category_product WHERE category_product_alias = '${category_product_alias}';`
            const get_id_category_product = yield t.one(id_category_product)

            const category_product_id = +get_id_category_product.category_product_id
            const products = `SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.id AS product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr 
                                JOIN attribute_product AS ap ON ap.product_id = pr.id 
                                JOIN product_price AS pp ON pp.attribute_product_id = ap.id 
                                WHERE pr.category_product_id = ${category_product_id};`
            let getProducts = yield t.any(products)
            let result = []
            for (let item in getProducts) {
                let product = getProducts[item]
                let product_id = +product.product_id
                let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                if (!product.rate) product.rate = Math.round(rate)
                result.push(product)
            }

            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        products: result,
                        authors: data[2],
                        materials: data[3],
                        url: req.url.slice(1).split('/'),
                        category_product_id: category_product_id
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
        let category_alias = info.param
        db.task('get product', function* (t) {
            const id_category = `SELECT id AS category_id FROM category WHERE category_alias = '${category_alias}';`
            const getIdCategory = yield t.one(id_category)

            let category_id = +getIdCategory.category_id
            const products = `SELECT cp.category_id, pr.product_name, pr.product_alias, ap.id AS product_id, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca 
                                JOIN category_product AS cp ON ca.id = cp.category_id 
                                JOIN product AS pr ON cp.id = pr.category_product_id 
                                JOIN attribute_product AS ap ON pr.id = ap.product_id 
                                JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id};`
            let getProducts = yield t.any(products)
            let result = []
            for (let item in getProducts) {
                let product = getProducts[item]
                let product_id = +product.product_id
                let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                let stars = +getNumberReviews.count * 5
                if (!product.stars) product.stars = +getNumberReviews.SUM
                result.push(product)
            }

            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: result,
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
    /** End */

    /*** Sắp xếp sản phẩm theo yêu cầu ***/
    router.post('/sort/products', (req, res) => {
        const info = req.body
        let condition = info.data
        let products
        let url = info.path
        let category_id = parseInt(info.category_product)
        let author = info.author
        let material = info.material
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
            switch (url) {

                case 'san-pham-group':
                    {
                        const products1 = `SELECT cp.category_id, pr.product_name, pr.product_alias,  ap.id AS product_id, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id JOIN product AS pr ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id} ${condition}`
                        const products3 = `SELECT cp.category_id, pr.product_name, pr.product_alias,  ap.id AS product_id, ap.images, ap.option_status, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM category AS ca JOIN category_product AS cp ON ca.id = cp.category_id JOIN product AS pr ON cp.id = pr.category_product_id JOIN attribute_product AS ap ON pr.id = ap.product_id JOIN product_price AS pp ON ap.id = pp.attribute_product_id WHERE ca.id = ${category_id} AND ${condition}`
                        products = condition !== "(option_status->'new_product') is not null;" ? products1 : products3

                        let getProducts = yield t.any(products)
                        let result = []
                        for (let item in getProducts) {
                            let product = getProducts[item]
                            let product_id = +product.product_id
                            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                            if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                            if (!product.rate) product.rate = Math.round(rate)
                            result.push(product)
                        }

                        return {
                            products: result
                        }
                    }

                case 'san-pham':
                    {
                        const products1 = `SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.id AS product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE pr.category_product_id = ${category_product_id} ${condition};`
                        const products3 = `SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.id AS product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE pr.category_product_id = ${category_product_id} AND ${condition};`
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3

                        let getProducts = yield t.any(products)
                        let result = []
                        for (let item in getProducts) {
                            let product = getProducts[item]
                            let product_id = +product.product_id
                            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                            if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                            if (!product.rate) product.rate = Math.round(rate)
                            result.push(product)
                        }

                        return {
                            products: result
                        }
                    }

                case '/':
                    {
                        const products1 = `
                SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.id AS product_id, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id  ${condition}`
                        const products3 = `
                SELECT pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.id AS product_id, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE ${condition}`

                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3

                        let getProducts = yield t.any(products)
                        let result = []
                        for (let item in getProducts) {
                            let product = getProducts[item]
                            let product_id = +product.product_id
                            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                            if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                            if (!product.rate) product.rate = Math.round(rate)
                            result.push(product)
                        }

                        return {
                            products: result
                        }
                    }

                case 'tac-gia':
                    {
                        const products1 = `SELECT ap.id AS product_id ,pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'manufacturer' ? '${author}' ${condition};`
                        const products3 = `SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'manufacturer' ? '${author}' AND ${condition};`
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3
                        let getProducts = yield t.any(products)
                        let result = []
                        for (let item in getProducts) {
                            let product = getProducts[item]
                            let product_id = +product.product_id
                            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                            if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                            if (!product.rate) product.rate = Math.round(rate)
                            result.push(product)
                        }

                        return {
                            products: result
                        }
                    }

                case 'chat-lieu':
                    {
                        const products1 = `SELECT ap.id AS product_id ,pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'material' ? '${material}' ${condition};`
                        const products3 = `SELECT pr.product_name,pr.product_alias, pr.category_product_id, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE attributes->'material' ? '${material}' AND ${condition};`
                        products = (condition !== "(option_status->'new_product') is not null;") ? products1 : products3
                        let getProducts = yield t.any(products)
                        let result = []
                        for (let item in getProducts) {
                            let product = getProducts[item]
                            let product_id = +product.product_id
                            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                            if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                            if (!product.rate) product.rate = Math.round(rate)
                            result.push(product)
                        }

                        return {
                            products: result
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
            const products = `SELECT ap.id AS product_id , pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE (attributes->'manufacturer') ? '${author}';`
            let getProducts = yield t.any(products)
            let result = []
            for (let item in getProducts) {
                let product = getProducts[item]
                let product_id = +product.product_id
                let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                if (!product.rate) product.rate = Math.round(rate)
                result.push(product)
            }
            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: result,
                        url: req.url.slice(1).split('/')[1],
                        author: author
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

    router.get('/san-pham/chat-lieu/:material', (req, res) => {
        const material = req.params.material.replace(/-/g, ' ')
        db.task('get product of author', function* (t) {
            const products = `SELECT ap.id AS product_id , pr.product_name,pr.product_alias, ap.option_status, pp.product_price, ap.images, ap.attributes, pp.original_price, pp.sale_off_price FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id JOIN product_price AS pp ON pp.attribute_product_id = ap.id WHERE (attributes->'material') ? '${material}';`
            let getProducts = yield t.any(products)
            let result = []
            for (let item in getProducts) {
                let product = getProducts[item]
                let product_id = +product.product_id
                let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id}`)
                if (!product.numberReviews) product.numberReviews = +getNumberReviews.count
                let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
                if (!product.rate) product.rate = Math.round(rate)
                result.push(product)
            }
            return menu()
                .then(data => {
                    return {
                        menuArea: data[0],
                        menuCategory: data[1],
                        authors: data[2],
                        materials: data[3],
                        products: result,
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
    /** End */

    /*** Giỏ hàng ***/
    router.post('/add_to_cart', (req, res) => {
        // console.log(req.session)
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
        if (!req.session.passport && !req.session.user) user_id = null
        db.task('add product to cart', function* (t) {
            const status1 = `SELECT count(1) FROM cart WHERE attribute_product_id = ${product_id} AND session_user_id = '${sessID}';`
            const status2 = `SELECT count(1) FROM cart WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};`
            const status = (!req.session.passport) ? status1 : status2

            const productExistsIncart = yield t.one(status)

            switch (productExistsIncart.count) {
                case '0': // sản phẩm này chưa có trong giỏ hàng.
                    {
                        const cart = `INSERT INTO cart(session_user_id,attribute_product_id,quantity,user_id,event_id,total) VALUES('${sessID}', ${product_id},${quantity},${user_id},null,null);`
                        yield t.any(cart)
                        const sum1 = `SELECT SUM(quantity) FROM cart  WHERE session_user_id = '${sessID}';`
                        const sum2 = `SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};`
                        const sum = (!req.user) ? sum1 : sum2
                        const getSum = yield t.one(sum)
                        // để trong array vì lúc thêm 1 sản phẩm nữa sẽ  có thể xảy ra tình trạng hết hàng.
                        return [+getSum.sum]
                    }
                    break

                case '1': // sản phẩm đã tồn tại trong giỏ hàng
                    {
                        // lấy ra số lượng của sản phẩm ở trong giỏ hàng
                        const qty1 = `SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = '${sessID}';`
                        const qty2 = `SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id =${user_id};`
                        const qty = (!req.user) ? qty1 : qty2
                        let getQuality = yield t.one(qty)

                        // Lấy ra số lượng còn lại của từng sản phẩm
                        const rest_of_product = `SELECT rest_of_product FROM attribute_product WHERE id = ${product_id};`
                        const getRestProduct = yield t.one(rest_of_product)

                        // update số lượng của từng sản phẩm ở bên trong giỏ 
                        let quantityUpdate = parseInt(getQuality.quantity) + quantity
                        const updateQuantity1 = `UPDATE cart SET quantity = ${quantityUpdate} WHERE attribute_product_id = ${product_id} AND session_user_id = '${sessID}';`
                        const updateQuantity2 = `UPDATE cart SET quantity = ${quantityUpdate} WHERE attribute_product_id = ${product_id} AND user_id =${user_id};`
                        const updateQuantity = (!req.user) ? updateQuantity1 : updateQuantity2

                        // Lấy ra tổng số sản phẩm có trong giỏ hàng.
                        const sum1 = `SELECT SUM(quantity) FROM cart  WHERE session_user_id = '${sessID}';`
                        const sum2 = `SELECT SUM(quantity) FROM cart  WHERE user_id = ${user_id};`
                        const sum = (!req.user) ? sum1 : sum2
                        const getSum = yield t.one(sum)

                        // Khi update số lượng của từng sản phẩm thì số lượng ở trong giỏ hàng không được vượt quá số lượng còn lại ở trong kho.
                        if (+getQuality.quantity < +getRestProduct.rest_of_product) {
                            yield t.any(updateQuantity)
                            // + 1 là để không phải viết thêm câu lệnh truy vấn lấy ra quantity sau khi tăng số lượng sản phẩm 1 lần nữa 
                            return [+getSum.sum + 1, +getQuality.quantity + 1, +getRestProduct.rest_of_product]
                        } else {
                            console.log('het hang')
                            return [+getSum.sum, +getQuality.quantity, 'hết hàng']
                        }
                    }
                    break
            }

        })
            .then(data => {
                /**
                 * Khi sử dụng axios : để gán 1 thuộc tính nào vào trong cookie ta phải trả lại cho client 1 dữ liệu nào đó.
                 * Khi đó ta mới gán thuộc tính vào session thành công
                 */
                res.json({ total: data[0], quantity: data[1], rest: data[2] })
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
            // Lấy thông tin của từng sản phẩm và số lượng của chúng có trong giỏ hàng
            let cartDetail = []
            let cart1 = `SELECT attribute_product_id, quantity FROM cart WHERE session_user_id = '${sessID}' ORDER BY id ASC;`
            let cart2 = `SELECT attribute_product_id, quantity FROM cart WHERE  user_id = ${user_id} ORDER BY id ASC;`
            let cart = (!req.user) ? cart1 : cart2
            let getCarts = yield t.any(cart)
            for (let item in getCarts) {
                let attribute_product_id = +getCarts[item].attribute_product_id
                let product = `
                SELECT pr.product_name,pr.product_alias, ap.rest_of_product, pp.product_price, ap.id AS product_id, ap.images, ap.total FROM product AS pr 
                JOIN attribute_product AS ap ON ap.product_id = pr.id 
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id 
                WHERE ap.id = ${attribute_product_id};`
                let getProduct = yield t.one(product)
                getProduct.quantity = getCarts[item].quantity
                cartDetail.push(getProduct)
                // khi số sản phẩm ở trong kho hết thì số lượng sản phẩm ở trong giỏ hàng cũng = 0
                if (+getProduct.rest_of_product === 0) {
                    let updateQuantity = `UPDATE cart SET quantity = 0 WHERE attribute_product_id = ${attribute_product_id} AND user_id = ${user_id};`
                    yield t.any(updateQuantity)
                }
            }

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

            // lấy ra số lượng của từng sản phẩm ở trong giỏ hàng
            const quantity1 = `SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = '${sessID}';`
            const quantity2 = `SELECT quantity FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id = ${user_id};`
            const quantity = (!req.user) ? quantity1 : quantity2
            let getQuality = yield t.one(quantity)

            // Lấy ra số lượng còn lại của từng sản phẩm
            const rest_of_product = `SELECT rest_of_product FROM attribute_product WHERE id = ${product_id};`
            const getRestProduct = yield t.one(rest_of_product)

            // Lấy ra tổng số sản phẩm có trong giỏ hàng.
            const cartProduct1 = `SELECT SUM(quantity) FROM cart WHERE session_user_id = '${sessID}';`
            const cartProduct2 = `SELECT SUM(quantity) FROM cart WHERE user_id = ${user_id};`
            const cartProduct = (!req.session.passport) ? cartProduct1 : cartProduct2
            const getSumCart = yield t.one(cartProduct)

            // update số lượng của từng sản phẩm ở bên trong giỏ hàng
            const updateQuantity1 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID};'
            const updateQuantity2 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const updateQuantity = (!req.session.passport) ? updateQuantity1 : updateQuantity2

            // Khi update số lượng của từng sản phẩm thì số lượng ở trong giỏ hàng không được vượt quá số lượng còn lại ở trong kho.
            if (+getQuality.quantity < +getRestProduct.rest_of_product) {
                yield t.any(updateQuantity, {
                    quantity: parseInt(getQuality.quantity) + 1,
                    product_id: product_id,
                    sessID: sessID,
                    user_id: user_id
                })
                // + 1 là để không phải viết thêm câu lệnh truy vấn lấy ra quantity sau khi tăng số lượng sản phẩm 1 lần nữa 
                return [+getSumCart.sum + 1, +getQuality.quantity + 1, +getRestProduct.rest_of_product]
            } else {
                console.log('het hang')
                return [+getSumCart.sum, +getQuality.quantity, 'hết hàng']
            }
        })
            .then(data => {
                console.log('đã tăng số lượng sản phẩm thành công!')
                res.json({ total: data[0], quantity: data[1], rest: data[2] })
            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
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
        const product_id = parseInt(req.params.product_id)
        const sessID = req.session.id
        db.task('decrease quantity product', function* (t) {
            // lấy ra số lượng của từng sản phẩm ở trong giỏ hàng
            const quantity1 = `SELECT quantity FROM cart WHERE attribute_product_id = ${product_id} AND session_user_id = '${sessID}';`
            const quantity2 = `SELECT quantity FROM cart WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};`
            const quantity = (!req.session.passport) ? quantity1 : quantity2
            let getQuality = yield t.one(quantity)

            // update số lượng của từng sản phẩm ở bên trong giỏ hàng
            const updateQuantity1 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND session_user_id = ${sessID};'
            const updateQuantity2 = 'UPDATE cart SET quantity = ${quantity} WHERE attribute_product_id = ${product_id} AND user_id = ${user_id};'
            const updateQuantity = (!req.user) ? updateQuantity1 : updateQuantity2
            yield t.any(updateQuantity, {
                quantity: parseInt(getQuality.quantity) - 1,
                product_id: product_id,
                sessID: sessID,
                user_id: user_id
            })

            // Lấy ra tổng số sản phẩm có trong giỏ hàng.
            const cartProduct1 = `SELECT SUM(quantity) FROM cart WHERE session_user_id = '${sessID}';`
            const cartProduct2 = `SELECT SUM(quantity) FROM cart WHERE user_id = ${user_id};`
            const cartProduct = (!req.session.passport) ? cartProduct1 : cartProduct2
            return yield t.one(cartProduct)

        })
            .then(data => {
                console.log('đã giảm số lượng sản phẩm thành công!')
                res.json({ total: +data.sum })

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
            // xóa sản phẩm ra khỏi giỏ hàng
            const product1 = `DELETE FROM cart WHERE cart.attribute_product_id = ${product_id} AND cart.session_user_id = '${sessID}';`
            const product2 = `DELETE FROM cart WHERE cart.attribute_product_id = ${product_id} AND user_id = ${user_id};`
            const product = (!req.session.passport) ? product1 : product2
            yield t.any(product)

            // Lấy số sản phẩm có trong giỏ hàng sau khi xóa
            const cartProduct1 = `SELECT SUM(quantity) FROM cart WHERE cart.session_user_id = '${sessID}';`
            const cartProduct2 = `SELECT SUM(quantity) FROM cart WHERE user_id = ${user_id};`
            const cartProduct = (!req.user) ? cartProduct1 : cartProduct2
            const getCartproduct = yield t.one(cartProduct)
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
        const emptyCart1 = `DELETE FROM cart WHERE session_user_id = '${sessID}';`
        const emptyCart2 = `DELETE FROM cart WHERE user_id = ${user_id};`
        const emptyCart = (!req.user) ? emptyCart1 : emptyCart2

        db.result(emptyCart)
            .then(result => {
                res.redirect('/gio-hang')
                console.log(`đã xóa hết ${result.rowCount} sản phẩm trong giỏ hàng`)
            })
            .catch(error => {
                console.log('ERROR:', error) // print the error;
            })
    })
    /** End */

    /*** chi tiet san pham ***/
    router.get('/san-pham/chi-tiet-san-pham/:product', (req, res) => {
        let product_id = parseInt(req.params.product.split('-').pop())
        let param = req.params.product.split('-')
        let alias = ''
        for (let i = 0; i < param.length - 1; i++) {
            alias += param[i] + '-'
        }
        let product_alias = alias.slice(0, -1)

        let allReviews = []
        db.task('chi tiet san pham', function* (t) {
            // lấy ra thông tin của sản phẩm
            let product_detail = `SELECT ap.id AS product_id, pr.product_name, ca.name_category, ca.category_alias, cp.name_category_product, cp.group_by_category, cp.category_product_alias ,pr.product_alias, ap.option_status, pr.description, pp.product_price, ap.images, ap.attributes, ap.total, ap.rest_of_product, pp.original_price, pp.sale_off_price 
                FROM product AS pr
                JOIN attribute_product AS ap ON ap.product_id = pr.id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id
                JOIN category_product AS cp ON cp.id = pr.category_product_id
                JOIN category AS ca ON cp.category_id = ca.id
                WHERE ap.id = ${product_id};`
            let getDataProductDetail = yield t.one(product_detail)

            let getNumberReviews = yield t.one(`SELECT COUNT(star), SUM(star) FROM customer_review_product WHERE attribute_product_id = ${product_id};`)
            if (!getDataProductDetail.numberReviews) getDataProductDetail.numberReviews = +getNumberReviews.count
            let rate = +getNumberReviews.sum / +getNumberReviews.count || 0
            if (!getDataProductDetail.rate) getDataProductDetail.rate = Math.round(rate)

            let count = `SELECT COUNT(ap.id) AS sum_products FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id WHERE pr.product_alias = '${product_alias}';`
            let count_product = yield t.one(count)

            let images = `SELECT ap.id AS product_id, ap.images, pr.product_alias FROM product AS pr JOIN attribute_product AS ap ON ap.product_id = pr.id WHERE pr.product_alias = '${product_alias}';`
            let getImages = yield t.any(images)

            //  end

            // lấy ra danh sách tất cả các nhận xét tồn tại của sản phẩm.
            let reviews = yield t.any(`SELECT id, title, content, time_review, star, customer_id FROM customer_review_product WHERE attribute_product_id = ${product_id} AND star != 0 ORDER BY id DESC;`)
            if (reviews.length > 0) {
                for (item in reviews) {
                    let review = reviews[item]
                    let customer_id = +review.customer_id

                    let userInfo = yield t.one(`SELECT address FROM customer_of_address WHERE customer_id = ${customer_id} AND (address -> 'address_default') is not null;`)

                    if (!review.customer_name && !review.address) {
                        review.customer_name = userInfo.address.full_name
                        review.address = userInfo.address.region_id
                    }
                    allReviews.push(review)
                }
                console.log('namduyen')
            } else {
                allReviews = null
            }

            // kiểm tra user đã mua sản phẩm này chưa để cho phép viết nhận xét
            if (req.session.passport || req.session.user) {
                let user_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)

                let permision = yield t.any(`SELECT permision FROM customer_review_product WHERE customer_id = ${user_id} AND attribute_product_id = ${product_id};`)

                if (permision.length > 0)
                    return [getDataProductDetail, count_product, getImages, permision[0].permision, allReviews]
                return [getDataProductDetail, count_product, getImages, false, allReviews]

            } else {
                return [getDataProductDetail, count_product, getImages, false, allReviews]
            }

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
                    permision: data[3],
                    reviews: data[4],
                    info: info
                })
            })
            .catch(err => {
                console.log(err.message)
            })

    })

    router.post('/review-product', checkUserLogin, (req, res) => {
        let info = req.body
        let title = info.title
        let content = info.content
        let time = new Date().toLocaleString()
        let star = +info.star
        let user_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        let product_id = +info.product_id
        let allReviews = []

        db.task('', function* (t) {
            let reviewProduct = `UPDATE customer_review_product 
                            SET title = '${title}', content = '${content}', time_review = '${time}', star = ${star} 
                            WHERE customer_id = ${user_id} AND attribute_product_id = ${product_id};`
            yield t.any(reviewProduct)
            // lấy ra danh sách tất cả các nhận xét tồn tại của sản phẩm.
            let reviews = yield t.any(`SELECT id, title, content, time_review, star, customer_id FROM customer_review_product WHERE attribute_product_id = ${product_id} AND star != 0 ORDER BY id DESC;`)
            if (reviews.length > 0) {
                for (item in reviews) {
                    let review = reviews[item]
                    let customer_id = +review.customer_id

                    let userInfo = yield t.one(`SELECT address FROM customer_of_address WHERE customer_id = ${customer_id} AND (address -> 'address_default') is not null;`)

                    if (!review.customer_name && !review.address) {
                        review.customer_name = userInfo.address.full_name
                        review.address = userInfo.address.region_id
                    }
                    allReviews.push(review)
                }
            } else {
                allReviews = null
            }
            return allReviews
        })
            .then(data => {
                res.render(frontendPath + 'Shop/Product/review-customer', {
                    reviews: data
                })
            })
    })

    /** End */

    // Trang yêu thích
    router.post('/add_to_wishlish', checkUserLogin, (req, res) => {
        const product_id = parseInt(req.body.product_id)

        /**
         * Nếu user mới đăng kí thì customer_id sẽ được lấy ra từ `req.session`.
         * Nếu user đăng nhập thì customer_id sẽ được lấy ra từ `req.session.passport`.
         */
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('add to wishlish', function* (t) {
            const status = `SELECT count(1) FROM wishlish WHERE attribute_product_id = ${product_id} AND customer_id = ${customer_id};`
            const wishlishExist = yield t.one(status)

            switch (wishlishExist.count) {
                case '0':
                    {
                        const insertWishlish = `INSERT INTO wishlish(attribute_product_id, customer_id) VALUES (${product_id}, ${customer_id});`
                        yield t.any(insertWishlish)
                        req.flash('wishlish', 'Đã thêm sản phẩm vào danh sách yêu thích.')
                    }
                    break
                case '1':
                    req.flash('wishlish', ' Bạn đã thêm sản phẩm vào danh sách yêu thích.')
                    break
            }
            const countWishlish = `SELECT COUNT(attribute_product_id) FROM wishlish WHERE customer_id = ${customer_id};`
            const getCountWishlish = yield t.one(countWishlish)
            /**
            * Khi sử dụng axios : để gán 1 thuộc tính nào vào trong cookie ta phải trả lại cho client 1 dữ liệu nào đó.
            * Khi đó ta mới gán thuộc tính vào session thành công
            */
            // update total wishlish in session
            if (req.session.passport) {

                req.session.passport.user.sumWishlish = parseInt(getCountWishlish.count)
            } else if (req.session.user) {

                req.session.user.sumWishlish = parseInt(getCountWishlish.count)
            }

            return getCountWishlish.count
        })
            .then(data => {
                res.json(data)
            })
    })

    router.post('/delete/wishlish', checkUserLogin, (req, res) => {
        const product_id = parseInt(req.body.product_id)
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('remove wishlish product', function* (t) {
            const wishlish = `DELETE FROM wishlish WHERE attribute_product_id = ${product_id} AND customer_id = ${customer_id} ;`
            yield t.any(wishlish)

            const countWishlish = `SELECT COUNT(attribute_product_id) FROM wishlish WHERE customer_id = ${customer_id};`
            const getCountWishlish = yield t.one(countWishlish)

            if (req.session.passport) req.session.passport.user.sumWishlish = parseInt(getCountWishlish.count)
            return getCountWishlish.count
        })
            .then(data => {
                res.json(data)
            })
    })

    /*** Các router sau cần phải xác thực user đăng nhập ***/
    router.get('/yeu-thich', checkUserLogin, (req, res) => {
        /**
         * Nếu user mới đăng kí thì customer_id sẽ được lấy ra từ `req.session`.
         * Nếu user đăng nhập thì customer_id sẽ được lấy ra từ `req.session.passport`.
         */
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        let getWishlishProducts = []
        db.task('wishlish detail', function* (t) {
            const wishlish = `SELECT attribute_product_id FROM wishlish WHERE  customer_id = ${customer_id} ORDER BY id ASC;`
            const getWishlishes = yield t.any(wishlish)

            for (let item in getWishlishes) {
                let attribute_product_id = getWishlishes[item].attribute_product_id
                let product = `
                SELECT pr.product_name,pr.product_alias, ap.rest_of_product, pp.product_price, ap.id AS product_id, ap.images, ap.total FROM product AS pr 
                JOIN attribute_product AS ap ON ap.product_id = pr.id 
                JOIN product_price AS pp ON pp.attribute_product_id = ap.id 
                WHERE ap.id = ${attribute_product_id};`

                let getProduct = yield t.one(product)
                getProduct.quantity = getWishlishes[item].quantity
                getWishlishProducts.push(getProduct)
                // khi số sản phẩm ở trong kho hết thì số lượng sản phẩm ở trong giỏ hàng cũng = 0
                if (+getProduct.rest_of_product === 0) {
                    let updateQuantity = `UPDATE cart SET quantity = 0 WHERE attribute_product_id = ${attribute_product_id} AND user_id = ${user_id};`
                    yield t.any(updateQuantity)
                }
            }
            return getWishlishProducts
        })
            .then(data => {
                if (req.session.url !== req.url) req.session.url = req.url
                let info = req.user
                res.render(frontendPath + 'Shop/wishlist', {
                    title: 'Trang yêu thích',
                    info: info,
                    products: data
                })
            })

    })
    /** End */

    // Trang sổ địa chị
    router.get('/so-dia-chi', checkUserLogin, (req, res) => {
        /**
         * Nếu ng dùng đăng nhập copy url sang 1 trình duyệt khác,
         * vì lúc này sẽ ko có cookie của ng dùng đăng nhập nên sẽ bị redirect về trang chủ.
         */
        let info = req.user
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id} ORDER BY address -> 'address_default' ASC;`
        db.any(address)
            .then(data => {
                res.render(frontendPath + 'Shop/address', {
                    title: 'Sổ địa chỉ',
                    info: info,
                    addresses: data
                })
            })

    })

    router.get('/them-dia-chi', checkUserLogin, (req, res) => {
        let info = req.user
        res.render(frontendPath + 'Shop/add-address', {
            title: 'Sổ địa chỉ',
            info: info
        })

    })

    router.post('/them-dia-chi', checkUserLogin, (req, res) => {
        const info = req.body
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        let addressInput = {
            full_name: info.full_name,
            company: info.company,
            telephone: info.telephone,
            region_id: info.region_id,
            city_id: info.city_id,
            ward_id: info.ward_id,
            street: info.street,
            address_default: info.address_default
        }

        /**
         * Sau khi insert địa chỉ thành thì sẽ lấy ra thông tin địa chị, mục đích là để xem đã insert thành công hay chưa?
         */
        db.task('insert address of customer', function* (t) {
            /**
             * Các bước để thay đổi địa chỉ mặc định:
             * 1. Lấy ra địa chỉ mặc định từ field address.
             * 2. Xóa địa chỉ mặc định trong field address.
             * 3. Cập nhật lại field address.
             */

            // 1. Lấy ra địa chỉ mặc định từ field address.
            const addressDefault = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE  cus.id = ${customer_id} AND (address -> 'address_default') is not null;`
            const getStatusDefault = yield t.any(addressDefault)

            if (getStatusDefault.length === 1 && info.address_default) {
                // 2. Xóa địa chỉ mặc định trong field address.
                const removeAddressDefault = "SELECT jsonb ${address} - 'address_default' AS new_address "
                const getNewAddress = yield t.one(removeAddressDefault, {
                    address: getStatusDefault[0].address
                })

                // 3. Cập nhật lại field address.
                const updateAddress = 'UPDATE customer_of_address SET address = ${address} WHERE id = ${id}'
                yield t.any(updateAddress, {
                    address: getNewAddress.new_address,
                    id: parseInt(getStatusDefault[0].id)
                })
            }

            /**
             * Thêm địa chỉ mới.
             * Viết bên ngoài if bởi vì có 2 trường hợp:
             * - Thêm địa chỉ mặc đinh mới.
             * - Thêm địa chỉ nhưng vẫn giữ nguyên địa chỉ mặc định ban đầu.
             */
            const insertAddress = 'INSERT INTO customer_of_address (address, customer_id) VALUES (${address}, ${customer_id});'
            yield t.any(insertAddress, {
                address: addressInput,
                customer_id: customer_id
            })

            // Chỉnh sửa địa chỉ


            // Kiểm tra đã thêm địa chỉ thành công hay chưa?
            const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id};`
            return t.any(address)
        })
            .then(data => {
                const url = req.query.url
                console.log(url)
                if (url === 'shipping') {
                    res.redirect('/shipping')
                } else {
                    if (data.length !== 0)
                        res.redirect('/so-dia-chi')
                    console.log('Thêm địa chỉ thành công!')
                }
            })
    })

    router.get('/chinh-sua-dia-chi/edit', checkUserLogin, (req, res) => {

        const address_id = parseInt(req.query.id)
        const info = req.user
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id} AND cod.id = ${address_id};`
        db.one(address)
            .then(data => {
                res.render(frontendPath + 'Shop/add-address', {
                    title: 'Sổ địa chỉ',
                    info: info,
                    data: data
                })
            })
    })

    // chỉnh sửa đị chỉ trang shipping
    router.post('/chinh-sua-dia-chi/edit', checkUserLogin, (req, res) => {
        const address_id = parseInt(req.query.id)
        const info = req.user
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id} AND cod.id = ${address_id};`
        db.one(address)
            .then(data => {
                res.json(data)
            })
    })

    // chỉnh sửa địa chỉ trang sổ địa chỉ
    router.post('/customer/address/edit', checkUserLogin, (req, res) => {
        const addressId = parseInt(req.query.id)
        const info = req.body
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        let addressInput = {
            full_name: info.full_name,
            company: info.company,
            telephone: info.telephone,
            region_id: info.region_id,
            city_id: info.city_id,
            ward_id: info.ward_id,
            street: info.street,
            address_default: info.address_default
        }

        /**
         * Sau khi insert địa chỉ thành thì sẽ lấy ra thông tin địa chị, mục đích là để xem đã insert thành công hay chưa?
         */
        db.task('insert address of customer', function* (t) {
            /**
             * Các bước để thay đổi địa chỉ mặc định:
             * 1. Lấy ra địa chỉ mặc định từ field address.
             * 2. Xóa địa chỉ mặc định trong field address.
             * 3. Cập nhật lại field address.
             */

            // 1. Lấy ra địa chỉ mặc định từ field address.
            const addressDefault = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE  cus.id = ${customer_id} AND (address -> 'address_default') is not null;`
            const getStatusDefault = yield t.any(addressDefault)

            if (getStatusDefault.length === 1 && info.address_default) {
                // 2. Xóa địa chỉ mặc định trong field address.
                const removeAddressDefault = "SELECT jsonb ${address} - 'address_default' AS new_address "
                const getNewAddress = yield t.one(removeAddressDefault, {
                    address: getStatusDefault[0].address
                })

                // 3. Cập nhật lại field address.
                const updateAddress = 'UPDATE customer_of_address SET address = ${address} WHERE id = ${id}'
                yield t.any(updateAddress, {
                    address: getNewAddress.new_address,
                    id: parseInt(getStatusDefault[0].id)
                })

                /**
                 * Set địa chỉ mặc định mới.
                 * Viết bên trong if bởi vì phải tồn tại địa chỉ mặc định mới có thể Set địa chỉ mặc định mới đc.
                 */
                const setAddress = 'UPDATE customer_of_address SET address = ${address} WHERE id = ${id}'
                yield t.any(setAddress, {
                    address: addressInput,
                    id: addressId
                })
            }

            // Kiểm tra đã thêm địa chỉ thành công hay chưa?
            const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id};`
            return t.any(address)
        })
            .then(data => {
                const url = req.query.url
                if (url === 'shipping') {
                    res.redirect('/shipping')
                } else {
                    if (data.length !== 0)
                        res.redirect('/so-dia-chi')
                    console.log('Thêm địa chỉ thành công!')
                }
            })
    })

    router.get('/delete/address', checkUserLogin, (req, res) => {
        let addressId = parseInt(req.query.id)
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('delete address', function* (t) {
            const deleteAddress = `DELETE FROM customer_of_address WHERE id = ${addressId};`
            yield t.any(deleteAddress)
            // Kiểm tra đã xóa địa chỉ thành công hay chưa?
            const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id};`
            return t.any(address)
        })
            .then(data => {
                const url = req.query.url
                if (url === 'shipping') {
                    res.redirect('/shipping')
                } else {
                    if (data.length !== 0)
                        res.redirect('/so-dia-chi')
                    console.log('Thêm địa chỉ thành công!')
                }
            })
    })
    /** End */

    // Phần thanh toán
    router.get('/shipping', checkUserLogin, (req, res) => {
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id} ORDER BY address -> 'address_default' ASC;`
        db.any(address)
            .then(data => {
                res.render(frontendPath + 'Shop/Payment/shipping', {
                    title: 'Shipping',
                    addresses: data
                })
            })
    })

    router.get('/thanh-toan', checkUserLogin, (req, res) => {
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address_id = parseInt(req.query.address_id)
        db.task('payment', function* (t) {
            // Lấy ra địa chỉ nhận hàng
            const address = `SELECT cod.id, cod.address FROM customer_of_address AS cod JOIN customer AS cus ON cus.id = cod.customer_id WHERE cus.id = ${customer_id} AND cod.id = ${address_id};`
            const getAddress = yield t.one(address)

            // Lấy ra số sản phẩm và số lượng sản phẩm
            const cart = `SELECT attribute_product_id, quantity FROM cart WHERE user_id = ${customer_id}`
            const getCart = yield t.any(cart)

            // lấy ra phí vận chuyển
            const fee_transport = `SELECT id, fee FROM fee_transport;`
            const getFeeTransport = yield t.any(fee_transport)

            // lấy ra phương thức thanh toán
            const payment_method = `SELECT id, name, alias FROM payment_method;`
            const getPaymentMethod = yield t.any(payment_method)

            let products = []
            for (let item in getCart) {
                let attribute_product_id = getCart[item].attribute_product_id
                const product = `
                            SELECT pr.product_name,pr.product_alias, pp.product_price, ap.id AS product_id, ap.attributes, ap.total FROM product AS pr 
                            JOIN attribute_product AS ap ON ap.product_id = pr.id 
                            JOIN product_price AS pp ON pp.attribute_product_id = ap.id 
                            WHERE ap.id = ${attribute_product_id} AND ap.rest_of_product != 0;`
                const getProduct = yield t.any(product)
                // phải tồn tại sản phẩm theo đúng điều kiện bên trên
                if (getProduct[0] && !getProduct[0].quantity) {
                    getProduct[0].quantity = getCart[item].quantity
                    products.push(getProduct[0])
                }
            }
            return [getAddress, products, getFeeTransport, getPaymentMethod]
        })
            .then(data => {
                // res.json(data)
                res.render(frontendPath + 'Shop/Payment/payment', {
                    title: 'Thanh toán',
                    address: data[0],
                    products: data[1],
                    fee: data[2],
                    payment_methods: data[3]
                })
            })
            .catch(err => {
                console.log('trang thanh toán ', err.message)
            })
    })

    router.post('/checkout/payment', checkUserLogin, (req, res) => {
        const info = req.body

        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        const address_id = parseInt(info.customer_of_address)
        db.task('insert info customer into order', function* (t) {
            const address = `SELECT address FROM customer_of_address WHERE id = ${address_id};`
            const getAddress = yield t.one(address)

            const products = `SELECT attribute_product_id, quantity FROM cart WHERE user_id = ${customer_id} AND quantity != 0;`
            const getProducts = yield t.any(products)

            // lấy thời gian tạo đơn hàng
            const time = new Date().toLocaleString().split(' ')
            const date = time[0].split('-')
            const hour = time[1]
            const time_order = hour + ' ' + date[2] + '/' + date[1] + '/' + date[0]

            const order = "INSERT INTO purchase(name_receiver, phone_receiver, address_receiver, product, status_purchase, time_order, time_delivery, customer_id, transport_method, fee_transport_id, payment_method_id, code_purchase) VALUES(${customer}, ${phone}, ${address_receiver}, ${product}, 'pending', ${time_order}, null, ${customer_id}, ${transport_method}, ${fee_transport_id}, ${payment_method_id}, ${code_purchase});"
            yield t.any(order, {
                customer: getAddress.address.full_name,
                phone: getAddress.address.telephone,
                address_receiver: getAddress.address.street + ',' + getAddress.address.ward_id + ',' + getAddress.address.region_id,
                product: getProducts,
                time_order: time_order,
                customer_id: customer_id,
                transport_method: ' Giao hàng tiêu chuẩn',
                fee_transport_id: req.query.fee_transport,
                payment_method_id: info['payment-method'],
                code_purchase: shortid.generate()
            })
            yield t.any(`DELETE FROM cart WHERE user_id = ${customer_id};`)
            const code_purchase = `SELECT code_purchase FROM purchase WHERE customer_id = ${customer_id} ORDER BY id DESC LIMIT 1`
            return yield t.one(code_purchase)
        })
            .then(data => {
                res.render(frontendPath + 'Shop/Order/order-success', {
                    order_code: data.code_purchase,
                    title: 'Đặt hàng thành công'
                })
            })
    })

    router.get('/don-hang-cua-toi', checkUserLogin, (req, res) => {
        let info = req.user
        let customer_id = (req.session.user) ? parseInt(req.session.user.id) : parseInt(req.session.passport.user.id)
        db.task('get orders', function* (t) {
            const orders = `SELECT id, code_purchase, time_order, product, status_purchase FROM purchase WHERE customer_id = ${customer_id} ORDER BY id DESC;`
            const getOrders = yield t.any(orders)

            let allOrders = []
            let allProducts = []
            for (let order in getOrders) {
                let products = getOrders[order]
                //Tính toán tổng số tiền của từng đơn hàng
                let total = 0
                for (let item in products.product) {
                    let product = JSON.parse(products.product[item])
                    let id = +product.attribute_product_id
                    // lấy giá của từng sản phẩm
                    const product_price = `SELECT product_price FROM product_price WHERE attribute_product_id = ${id};`
                    const getProductPrice = yield t.one(product_price)

                    // lấy tên của từng sản phẩm
                    const name_product = `SELECT product_name FROM product JOIN attribute_product AS ap ON product.id = ap.product_id WHERE ap.id = ${id};`
                    const getNameProduct = yield t.one(name_product)

                    // Tên của tất cả sản phẩm
                    allProducts.push(getNameProduct.product_name)
                    // tổng số tiền của từng đơn hàng
                    total += getProductPrice.product_price * product.quantity
                }

                allOrders.push({
                    code_purchase: products.code_purchase.trim(),
                    time_order: products.time_order.split(' '),
                    total: total,
                    status_purchase: products.status_purchase.trim(),
                    product: [...new Set(allProducts)]
                })
            }
            return allOrders
        })
            .then(data => {
                res.render(frontendPath + 'Shop/Order/order', {
                    title: 'Đơn hàng của tôi',
                    info: info,
                    orders: data
                })
            })
    })

    router.get('/order_detail', checkUserLogin, (req, res) => {
        let info = req.user
        const code_purchase = req.query.code.trim()

        db.task('detail order', function* (t) {
            const order = `SELECT name_receiver, phone_receiver, address_receiver, product, status_purchase, time_order, transport_method, code_purchase, pm.name AS payment_method, ft.fee FROM purchase AS pc 
                            JOIN fee_transport AS ft ON ft.id = pc.fee_transport_id 
                            JOIN payment_method AS pm ON pc.payment_method_id = pm.id 
                            WHERE pc.code_purchase = '${code_purchase}';`
            const getOrder = yield t.one(order)

            let products = getOrder.product

            let allProducts = []
            //Tính toán tổng số tiền của từng đơn hàng
            let total = 0
            for (let item in products) {
                let product = JSON.parse(products[item])
                let id = +product.attribute_product_id
                // lấy giá của từng sản phẩm
                const product_price = `SELECT product_price FROM product_price WHERE attribute_product_id = ${id};`
                const getProductPrice = yield t.one(product_price)
                // lấy tên của từng sản phẩm
                const name_product = `SELECT pr.product_name, ap.images, pr.product_alias, ap.id AS product_id FROM product AS pr JOIN attribute_product AS ap ON pr.id = ap.product_id WHERE ap.id = ${id};`
                const getNameProduct = yield t.one(name_product)

                // tổng số tiền của từng đơn hàng
                total += getProductPrice.product_price * product.quantity
                allProducts.push({
                    product_price: getProductPrice.product_price,
                    quantity: product.quantity,
                    product: getNameProduct
                })
            }
            return [getOrder, allProducts, total]
        })
            .then(data => {
                // res.json(data)
                res.render(frontendPath + 'Shop/Order/order-detail', {
                    title: 'Chi tiết đơn hàng',
                    info: info,
                    order: data[0],
                    products: data[1],
                    total: parseInt(data[2])
                })
            })

    })

    router.get('/order_cancel', checkUserLogin, (req, res) => {
        const code_order = req.query.code
        const orderSuccess = `UPDATE purchase SET status_purchase = 'cancel' WHERE code_purchase = '${code_order}';`
        db.task('update status order', function* (t) {
            yield t.any(orderSuccess)
            return 1
        })
            .then(() => {
                res.redirect('/order_detail?code=' + code_order)
            })
    })
    /** End */
}