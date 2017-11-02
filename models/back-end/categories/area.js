/**
 * Created by namdoremon on 8/16/17.
 */
module.exports.areaModel = function (db, app, backendPath) {
    const routerArea = require('../../../routes/back-end/categories/area').area
    const selectAllArea = 'SELECT ar.area_name, ar.time_create FROM area AS ar ORDER BY ar.area_id ASC;'

    db.task('selectAllArea',function * (t) {
       return yield t.any(selectAllArea)
    }).then(data => {
        // console.log(data);
        routerArea(app, backendPath, data, db)
    })

}