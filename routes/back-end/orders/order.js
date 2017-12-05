module.exports = function (router, backendPath, db) {
    const checkUserLogin = (req, res, next) => { req.session.passport ? next() : res.redirect('/admin/login') }

    router.get('/admin/order', checkUserLogin, (req, res) => {

        db.task('get orders', function* (t) {

            // Đếm số đơn hàng đang chờ xử lý 
            const ordersPending = "SELECT COUNT(id) FROM purchase WHERE status_purchase = 'pending';"
            const getOrdersPending = yield t.one(ordersPending)

            //Đếm số đơn hàng ngày hôm qua

            // Đếm số đơn hàng tháng này

            // Đếm số đơn hàng tháng trước

            // Lấy ra tất cả đơn hàng, lấy theo thứ tự gần nhất
            const orders = `SELECT pc.code_purchase, pc.name_receiver, pc.product, pm.alias, pc.status_purchase, pc.time_order, ft.fee 
                            FROM purchase AS pc 
                            JOIN payment_method AS pm ON pm.id = pc.payment_method_id 
                            JOIN fee_transport AS ft ON ft.id = pc.fee_transport_id
                            ORDER BY pc.id DESC;`
            const getOrders = yield t.any(orders)


            let allOrders = []
            for (let order in getOrders) {
                let products = getOrders[order]

                // Tính toán tổng số tiền của từng đơn hàng
                let total = 0
                let quantity = 0
                for (let item in products.product) {
                    let product = JSON.parse(products.product[item])
                    // lấy giá của từng sản phẩm
                    const product_price = 'SELECT product_price FROM product_price WHERE attribute_product_id = ${id};'
                    const getProductPrice = yield t.one(product_price, {
                        id: product.attribute_product_id
                    })

                    // tổng số tiền của từng đơn hàng 
                    total += getProductPrice.product_price * product.quantity
                    quantity += product.quantity
                }

                allOrders.push({
                    code_purchase: products.code_purchase.trim(),
                    customer: products.name_receiver,
                    quantity: quantity,
                    payment_method: products.alias,
                    status_purchase: products.status_purchase.trim(),
                    time_order: products.time_order.split(' '),
                    total: total + +products.fee
                })

            }

            return [allOrders, getOrdersPending]
        })
            .then(data => {
                res.render(backendPath + '/orders/order', {
                    orders: data[0],
                    ordersPending: data[1]
                })
            })
    })

    router.get('/admin/order_detail', checkUserLogin, (req, res) => {
        const code_order = req.query.code
        db.task('get orders', function* (t) {
            // Lấy thông tin của đơn hàng
            const order = 'SELECT code_purchase, name_receiver, customer_id, phone_receiver, address_receiver, product, status_purchase, ft.fee, time_order FROM purchase  JOIN fee_transport AS ft ON ft.id = purchase.fee_transport_id  WHERE code_purchase = ${code};'
            const getOrder = yield t.one(order, {
                code: code_order.trim()
            })

            const customerInfo = 'SELECT username, email, phone FROM customer WHERE id = ${id};'
            const getCustomerInfo = yield t.one(customerInfo, {
                id: parseInt(getOrder.customer_id)
            })

            let allProducts = []
            let products = getOrder.product
            // Tính toán tổng số tiền của từng đơn hàng
            let sum = 0
            for (let item in products) {
                let total = 0
                let product = JSON.parse(products[item])
                // lấy giá của từng sản phẩm
                const product_id = +product.attribute_product_id

                const productInfo = `
                SELECT ap.id, pr.product_name, pr.ucp, ap.rest_of_product, pp.product_price
                    FROM attribute_product AS ap
                    JOIN product AS pr ON pr.id = ap.product_id
                    JOIN product_price AS pp ON ap.id = pp.attribute_product_id
                    WHERE attribute_product_id = ${product_id}
                `
                const getProductInfo = yield t.one(productInfo)

                // tổng số tiền của từng đơn hàng không tính phí vận chuyển
                total = getProductInfo.product_price * product.quantity
                sum += total
                allProducts.push({
                    product_id: getProductInfo.id,
                    ucp: getProductInfo.ucp,
                    name_product: getProductInfo.product_name,
                    rest: getProductInfo.rest_of_product,
                    quantity: product.quantity,
                    product_price: getProductInfo.product_price,
                    total: total
                })
            }

            return [getOrder, getCustomerInfo, allProducts, sum]
        })
            .then(data => {
                res.render(backendPath + 'orders/order-detail', {
                    orderInfo: data[0],
                    customer: data[1],
                    products: data[2],
                    sum: data[3]
                })
            })
    })

    router.get('/admin/order_detali/order_success', checkUserLogin, (req, res) => {
        const code_order = req.query.code
        const orderSuccess = "UPDATE purchase SET status_purchase = 'success' WHERE code_purchase = ${code_order};"
        db.task('update status order', function* (t) {
            yield t.any(orderSuccess, {
                code_order: code_order
            })
            return 1
        })
            .then(() => {
                res.redirect('/admin/order_detail?code=' + code_order)
            })
    })

}