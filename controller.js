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

exports.getStockDetails = function(req,res){
    var id = req.params.id;

    connection.query('SELECT products.id_product, products.product_name,products.description_product,products.image,price.purcase_price,price.selling_price,products.stock FROM products,price WHERE products.id_product = price.id_product AND products.id_product = ?', [id],
        function(error,rows,fields){
            if(error){
                console.log(error);
            }else{
                response.ok(rows,res);
            }
        });
};

exports.editStock = function(req,res){
    console.log(req.body);
    var id_product = req.params.id;
    var product_name = req.body.product_name;
    var description_product = req.body.description_product;
    var selling_price = req.body.selling_price;
    var stock = req.body.stock;

    connection.query ('UPDATE products SET product_name = ?, description_product = ?, stock = ? WHERE id_product = ?', [product_name,description_product,stock,id_product],
        function(error, rows, fields){
            if(error){
                console.log(error);
            }else{
                response.ok('Data successfully updated',res);
            }
        }
    );
};

exports.editPrice = function(req,res){
    
    var selling_price = req.body.selling_price;
    var purcase_price = req.body.purcase_price;
    var id_product = req.params.id;

    connection.query('UPDATE price SET selling_price = ?, purcase_price = ? WHERE id_product = ?',[selling_price,purcase_price,id_product],
        function(error, rows, fields){
                if(error){
                console.log(error);
                }else{
                    response.ok('Data successfully updated',res);
                }
            }
        );
}



