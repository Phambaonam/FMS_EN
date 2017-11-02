/**
 * Created by namdoremon on 8/10/17.
 */
module.exports.shopModel = function (db, app, frontendPath) {
    const shop = require('../../../routes/front-end/shop/shop').shopPage
    let shopData = {}
    const allProduct = `
           SElECT array_to_json(array_agg(data.row_to_json))
        FROM (
            SELECT row_to_json(row) 
            FROM (
                SELECT pr.*, ap.attributes, pp.product_price, pp.original_price, pp.sale_off_price FROM product AS pr
                JOIN attribute_product as ap ON pr.product_id = ap.product_id
                JOIN product_price AS pp ON pp.attribute_product_id = ap.attribute_product_id
                ORDER BY pr.product_id ASC
            ) AS row
        ) AS data `
const test = ` select * from product`
    const menu = ``
    // db.many(allProduct)
    //     .then(data => {
    //         // shopData.allProduct = data[0]['array_to_json']
    //         // shop(app, frontendPath, shopData)
    //         shop(app, frontendPath, data)
    //     })
    //     .catch(error => {
    //         console.log('ERROR:', error); // print the error;
    //     });

    db.task(function * (t) {
      let Product = yield t.any(allProduct)
      let Test = yield t.any(test)
      shopData.allProduct = Product
      shopData.test = Test
      return shopData
    }).then(data => {
       shop(app, frontendPath, data)
    })

}


