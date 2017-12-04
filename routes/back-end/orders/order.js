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
            const orders = `SELECT pc.code_purchase, pc.name_receiver, pc.product, pm.alias, pc.status_purchase, pc.time_order 
                                FROM purchase AS pc 
                                JOIN payment_method AS pm ON pm.id = pc.payment_method_id ORDER BY pc.id DESC;`
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

                    // tổng số tiền của từng đơn hàng không tính phí vận chuyển
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
                    total: total
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
        res.render(backendPath + 'orders/order-detail')
        // db.task('get orders', function* (t) {

        //     // Đếm số đơn hàng đang chờ xử lý 
        //     const ordersPending = "SELECT COUNT(id) FROM purchase WHERE status_purchase = 'pending';"
        //     const getOrdersPending = yield t.one(ordersPending)

        //     //Đếm số đơn hàng ngày hôm qua

        //     // Đếm số đơn hàng tháng này

        //     // Đếm số đơn hàng tháng trước

        //     // Lấy ra tất cả đơn hàng, lấy theo thứ tự gần nhất
        //     const orders = `SELECT pc.code_purchase, pc.name_receiver, pc.product, pm.alias, pc.status_purchase, pc.time_order 
        //                         FROM purchase AS pc 
        //                         JOIN payment_method AS pm ON pm.id = pc.payment_method_id ORDER BY pc.id DESC;`
        //     const getOrders = yield t.any(orders)


        //     let allOrders = []
        //     for (let order in getOrders) {
        //         let products = getOrders[order]

        //         // Tính toán tổng số tiền của từng đơn hàng
        //         let total = 0
        //         let quantity = 0
        //         for (let item in products.product) {
        //             let product = JSON.parse(products.product[item])
        //             // lấy giá của từng sản phẩm
        //             const product_price = 'SELECT product_price FROM product_price WHERE attribute_product_id = ${id};'
        //             const getProductPrice = yield t.one(product_price, {
        //                 id: product.attribute_product_id
        //             })

        //             // tổng số tiền của từng đơn hàng không tính phí vận chuyển
        //             total += getProductPrice.product_price * product.quantity
        //             quantity += product.quantity
        //         }

        //         allOrders.push({
        //             code_purchase: products.code_purchase.trim(),
        //             customer: products.name_receiver,
        //             quantity: quantity,
        //             payment_method: products.alias,
        //             status_purchase: products.status_purchase.trim(),
        //             time_order: products.time_order.split(' '),
        //             total: total
        //         })

        //     }

        //     return [allOrders, getOrdersPending]
        // })
        //     .then(data => {
        //         res.render(backendPath + '/orders/order', {
        //             orders: data[0],
        //             ordersPending: data[1]
        //         })
        //     })
    })

}