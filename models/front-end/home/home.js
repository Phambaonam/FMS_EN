/**
 * Created by namdoremon on 8/16/17.
 */
module.exports.homeModel =  function (db, app, frontendPath) {
    const home = require('../../../routes/front-end/home/home').homePage
    home(app, frontendPath)
}