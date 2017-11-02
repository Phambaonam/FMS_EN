/**
 * Created by namdoremon on 8/16/17.
 */

module.exports = function (router, backendPath, db) {
    const getAlias = require('../getAlias').getAlias
    /***
     * Show all categories to page category
     */
    router.get('/admin/category/category', (req, res) => {
        const getDataCategory = 'SELECT ca.name_category, ca.time_create FROM category AS ca ORDER BY ca.id DESC;'
        db.task('selectCategory', function * (t) {
            return yield t.any(getDataCategory)
        })
            .then(data => {
                res.render(backendPath + '/categories/category', {
                    categories: data
                })
            })

    })

    /***
     * Go to page category edit to add, edit category
     */
    router.get('/admin/category/category_edit', (req, res) => {
        res.render(backendPath + '/categories/category_edit')
    })

    /***
     * Insert new category and show to page category
     */
    router.post('/admin/category/category_edit', (req, res) => {
        const category = req.body
        // res.json( )
        // res.json(getAlias(category.name_category))
        // console.log(category)
        const insertDataCategory = 'INSERT INTO category (name_category,category_alias, time_create) VALUES (${name_category},${category_alias},${time_create})'
        db.task('insert category', function * (t) {
            // insert data into database
            yield t.any(insertDataCategory, {
                name_category: category.name_category,
                category_alias: getAlias(category.name_category),
                time_create: category.time_create
            })
            return yield t.any('SELECT * FROM category AS ca ORDER BY ca.id ASC;')
        })
            .then(data => {
                // then redirect to page category and  data updated
                // res.json(data)
                res.redirect('/admin/category/category')
            })
    })
}