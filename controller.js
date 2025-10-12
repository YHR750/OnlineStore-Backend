'use strict';

var response = require('./res');
var connection = require('./connection');

exports.index = function(req, res){
    response.ok("Rest API berjalan",res);
};

exports.getProduct = function(req,res){
    connection.query('SELECT products.id_product,products.product_name,products.description_product,products.image,price.selling_price,products.more_item FROM products, price Where products.id_product = price.id_product AND products.more_item=FALSE',
        function(error,rows,fields){
            if (error){
                connection.log(error);
            }else{
                response.ok(rows,res);
            }
        });
};

exports.getMoreProduct = function(req,res){
    connection.query('SELECT products.id_product,products.product_name,products.description_product,products.image,price.selling_price,products.more_item FROM products, price Where products.id_product = price.id_product AND products.more_item=TRUE',
        function(error,rows,fields){
            if (error){
                connection.log(error);
            }else{
                response.ok(rows,res);
            }
        });
};

exports.getShopDetails = function(req,res){
    var id = req.params.id;

    connection.query('SELECT products.id_product,products.product_name,products.description_product,products.image,price.selling_price FROM products,price WHERE products.id_product=price.id_product AND products.id_product=?',[id],
        function(error,rows,fields){
            if (error){
                connection.log(error);
            }else{
                response.ok(rows,res);
            }
        });
};



