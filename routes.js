'use strict';

module.exports = function(app){
    var myjson = require('./controller')

    app.route('/')
        .get(myjson.index);

    app.route('/getProduct')
        .get(myjson.getProduct);

    app.route('/getMoreProduct')
        .get(myjson.getMoreProduct);

    app.route('/getShopDetails/:id')
        .get(myjson.getShopDetails);
}