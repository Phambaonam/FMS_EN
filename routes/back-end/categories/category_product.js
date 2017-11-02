/**
 * Created by namdoremon on 8/16/17.
 */
module.exports = function (router, backendPath, db) {
    const getAlias = require('../getAlias').getAlias
    /***
     *  Show all categories to page category product
     */
    router.get('/admin/category/category_product', (req, res) => {
        db.task('select-data-category-product', function * (t) {
            /***
             *   Select all category product
             */
            const getDataCategoryProduct = 'SELECT cp.id, cp.name_category_product, cp.areas, cp.time_create, ca.name_category FROM category_product AS cp ' +
                                          'JOIN category AS ca ON ca.id = cp.category_id ORDER BY cp.id DESC;'

            return yield t.any(getDataCategoryProduct)
        })
            .then(data => {
                // res.json(data)
                res.render(backendPath + 'categories/category_product', {
                    category_products: data
                })
            })
    })

    /***
     * Go to page category product edit to add, edit category product
     */
    router.get('/admin/category/category_product_edit', (req, res) => {

        db.task('select-area-category', function * (t) {
            /***
             *   Select all areas
             */
            const getDataArea = 'SELECT ar.area_name FROM area AS ar ORDER BY ar.id ASC;'
            let areaData = yield t.any(getDataArea)

            /***
             *      Select all categories
             */
            const getDataCategory = 'SELECT ca.name_category FROM category AS ca ORDER BY ca.id ASC;'
            let categoryData = yield t.any(getDataCategory)

            return {
                areaData: areaData,
                categoryData: categoryData
            }
        })
            .then(data => {           
                res.render(backendPath + 'categories/category_product_edit', {
                    areas: data.areaData,
                    categories: data.categoryData
                })
            })
    })

    /***
     * Insert new category and show to page category
     */
    router.post('/admin/category/category_product_edit', (req, res) => {
        const category_product = req.body
        db.task('insert category product', function * (t) {
            /***
             *  Convert string to array 
             *  When input only a area, typeof areas is string.
             *  When input have areas, typeof areas is array. 
             */
            if(typeof category_product.areas === 'string') {
                let result = []
                result.push(category_product.areas)
                category_product.areas = result
            }
            // End convert

            if(category_product.group_category === 'on'){
                category_product.group_category = true
            } else {
                category_product.group_category = false
            }
            /***
             *    Select category_id
             */
            const getCategoryId = 'SELECT id FROM category WHERE category.name_category = ${name_category}'
            let idCategory = yield t.any(getCategoryId, {
                name_category: category_product.name_category
            })

            /***
             *   Insert data into table category_product
             */
            const insertCategoryProduct = 'INSERT INTO category_product (name_category_product, group_by_category, areas, category_product_alias, time_create, category_id) ' +
                                          'VALUES (${name_category_product}, ${group_by_category}, ${areas}, ${category_product_alias}, ${time_create}, ${category_id})'
            yield t.any(insertCategoryProduct, {
                name_category_product: category_product.name_category_product,
                group_by_category:  category_product.group_category,
                areas: category_product.areas,
                category_product_alias: getAlias(category_product.name_category_product),
                time_create: category_product.time_create,
                category_id: idCategory[0].id
            })

            // return typeof category_product.areas
            return idCategory
        })
            .then(() => {
                res.redirect('/admin/category/category_product')
            })
    })
}