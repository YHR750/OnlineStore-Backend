const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../connection');
const resHelper = require('../res');
const { param } = require('../routes/authRoutes');
const { validationResult } = require('express-validator');

exports.registerUser = async(req,res) =>{
    const {user_name, email, password, role} = req.body
    try{
        const [ existingUser ] = await db.promise().query('SELECT * FROM `user` WHERE email=?', [email]);
        if(existingUser.length > 0){
            return res.status(400).json({message:'user already exist'});
        }
        const hashedPassword = await bcrypt.hash(password,10);
        await db.promise().query('INSERT INTO user (user_name,email,password,role) VALUES (?,?,?,?)', [user_name,email,hashedPassword,role]);
        resHelper.ok({message:'user register successfully'}, res);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`server error lah ${email}`});
    }
};

exports.loginUser = async(req,res) =>{
    const {email, password} = req.body
    try{
        const [user] = await db.promise().query('SELECT * FROM user WHERE email =?', [email]);
        if (user.length==0){
            return res.status(400).json({message:'Invalid credential'});
        }
        const isMatch = await bcrypt.compare(password,user[0].password);
        if (!isMatch){
            return res.status(400).json({message:'Invalid credential'});
        }
        const token = jwt.sign(
            {userId:user[0].user_id, role:user[0].role},
            'jwtsecret',
            {expiresIn: 10000}
        );
        res.json({token,role: user[0].role});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`server error lah`});
    }
};

exports.getUserProfile = async(req,res) =>{
    const {userId} = req.user;
    try{
        const [user] = await db.promise().query('SELECT user_id,user_name,email,role FROM user WHERE user_id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({message:'404 Not Found'});
        }
        resHelper.ok(user[0], res);
    }catch(error){
        res.status(500).json({message:'Server Error'});
    }

};

exports.getCart = async(req,res) =>{

    try{

    }catch(error){

    }
};

exports.addItem = async (req,res) => {
    const id_product = req.params.id;
    

    try{
        const userId = req.user?.id||null;
        const {product_id, quantity = quantity, metadata} = req.body;
        if (!product_id||quantity <= 0) return res.status(400).json({error:'invalid payload'});
        let cart;
        if(userId){
            const [crows] = await db.query('SELECT * FROM carts WHERE user_id = ? AND status = "active" LIMIT 1', [userId] );
            cart = crows[0];

            if(!cart){
                const [ins] = await db.query('INSERT INTO carts(user_id VALUES(?)', [userId]);
                cart = {id: ins,insertId};
            }
        }else{
            const sessionId = req.body.sessionId;
            if(!sessionId) return res.status(400).json({error:'session_id required for guest cart'});
            const [crows] = await db.query('SELECT * FROM carts WHERE session_id =? AND status ="active" LIMIT 1', [sessionId]);
            cart = crows[0];
            if(!cart){
                const [ins] = await db.query('INSERT INTO carts(session_id) VALUES (?)', [sessionId]);
                cart = {id:ins.insertId};
            }
        }

        const [prows] = await db.query('SELECT id, price, stock FROM products WHERE id = ? LIMIT 1', [product_id]);
        const product = prows[0]
        if(!product) return res.status(404).json({error: 'product not found'});
        if(product.stock < quantity) return res.status(400).json({error: 'insufficient stock'});

        const  [exorws] = await db.query('SELECT  FROM cart_items WHERE cart_id =? AND product_id = ? LIMIT 1', [cart.id,product_id]);
        if (exorws.length){
            const newQty = exorws[0].quantity+quantity;
            await db.query('UPDATE cart)items SET quantity = ?, price =? WHERE id =?', [newQty,product.price,exorws[0].id]);
        }else{
            await db.query('INSERT INTO cart_item (cart_id, product_id, quantity, price, metadata) VALUES (?,?,?,?,?)', [cart.id,product_id,quantity,product.price,JSON,stringify(metadata || {})]);
        }
        
        if(userId) return await this.getCart(req, res);
        return res.json({success: true});

    }catch(error){
        console.error(err)
        res.status(500).json({error:'server error'});
    }

};

