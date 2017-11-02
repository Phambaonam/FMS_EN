module.exports = function (router, backendPath, db) {
    const getAlias = require('../getAlias').getAlias
    /***
     *  Show all categories to page area
     */
    router.get('/admin/category/area', (req, res) => {
        const selectAllArea = 'SELECT ar.area_name, ar.time_create FROM area AS ar ORDER BY ar.id DESC;'
        db.task('selectAllArea',function * (t) {
            return yield t.any(selectAllArea)
        })
            .then(data => {
                res.render(backendPath + 'categories/area' , {
                    areas: data
                })
            })
    })

    /***
     *  Go to page area edit to add, edit area
     */
    router.get('/admin/category/area_edit', (req, res) => {
        res.render(backendPath + 'categories/area_edit')
    })

    /***
     *  Insert new area and show to page area
     */
    router.post('/admin/category/area_edit', (req, res) => {
        const area = req.body
        // const area_alias = getAlias(area.area_name)
        // res.json(area_alis)
        const insertAreaData = 'INSERT INTO area (area_name, time_create,area_alias) VALUES (${area_name},${time_create},${area_alias})'
        db.task('insertArea', function * (t) {
            // insert data into database
            yield t.any(insertAreaData, {
                area_name: area.area_name,
                area_alias: getAlias(area.area_name),
                time_create: area.time_create
            })
            return yield t.any('SELECT * FROM area;')
        })
            .then(data => {
                // then redirect to page area and data updated
                res.redirect('/admin/category/area')
            })
    })
}