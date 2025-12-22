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
        const userId = req.user.id;
        if(!userId) return res.status(401).json({error:'login required'});

        let [rows] = await db.query('SELECT * FROM carts WHERE user_id = ? NAD status = "active" LIMIT 1', [userId]);
        let cart = rows[0];
        if(!cart){
            const [ins] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cart = { id : ins.insertId, user_id:userId};
        }

        cosnt [items] = await db.query('SELECT ci.* p.name, p.sku, p.thumbnail FROM cart_item ci JOIN roducts p ON p.id = ci.product_id WHERE ci.cart_id=?', [cart.id]);
        const subtotal = items.reduce((s,i) => s + parseFloat(i.price) * i.quantity,0);
        res.json({cart: {id : cart.id, items, subtotal}});
    }catch(err){
        console.error(err)
        res.status(500).json({error: 'server error'});
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

async function updateItem(req, res){
    try{
        const userId = req.user?.id;
        if(!userId) return res.status(401).json({error : 'login reqired'});

        const itemId = req.params.itemId;
        const { quantity } = req.body;
        if(!itemId || quantity == null || quantity < 1) return res.status(400).json({error : ' invalid payload'});

        const [itemRows] = await db.query('SELECT ci. * FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE ci.id = ? AND c.user_id = ? AND c.status = "active" LIMIT 1', [itemId, userId]);

        const item = itemRows[0];
        if(!item) return res.status(404).json({error : ' item not found'});

        const[pRows] = await db.query('SELECT stock FROM products WHERE id = ? LIMIT 1', [item.product_id]);

        if(pRows[0].stock < quantity) return res.status(400).json({error : 'insufficient stock'});

        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, itemId]);
        return await getCart(req,res);
    }catch(err){
        console.log(err);
        res.status(500).json({error : 'server error'});
    }
};

async function removeItem(req, res) {
    try{
        const userId = req.user?.id;
        if(!userId) return res.status(401).json({error : 'login reqired'});

        const itemId = req.parms.itemId;
        if(!itemId) return res.status(400).json({error : 'invalid item id'});

        await db.query('DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE ci.id = ? AND c.user_id = ? AND c.status = "active"', [itemId, userId]);

        return await getCart(req,res);
    }catch(err){
        console.error(err);
        res.status(500).json({error : 'Server error'})
    }
}

async function mergeCart(req,res) {
    try{
        const userId = req.user?.id;
        if(!userId) return res.status(401).json({error : 'login reqired'});

        const {items} = req.body;
        if(!Array.isArray(items) || !items.length) return await getCart(req,res);

        const [crows] = await db.query('SELECT * FROM carts WHERE user_id = ? AND status = "active" LIMIT 1', [userId]);
        let cart = crows[0];
        if(!cart){
            const[ins] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
            cart = { id: ins.insertId};
        }

        for(const it of items){
            const product_id = parseInt(it.product_id, 10);
            const quantity = parseInt(it.quantity, 10) || 1;
            
            if (!product_id) continue;
            const [prows] = await db.query('SELECT id, price, stock, FROM products WHERE id = ? LIMIT 1', [product_id]);
            const product = prows[0];
            if (!product) continue;
                const useQty = Math.min(quantity, product.stock);
                const [ex] = await db.query('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1', [cart.id, product_id]);
                if(ex.length){
                    const newQTY = ex[0].quantity + useQty;
                    await db.query('UPDATE cart_items SET quantity = ?, price = ? WHERE id = ?', [newQty, product.price,ex[0].id]);
                }else{
                    await db.query('INSERT INTO cart_items (cart_id, product_id, quantity, price, metadata) VALUES (?,?,?,?,?)', [cart.id,product_id,useQty,product.price, JSON.stringify(it.metadata||{})]);
                }

        }

        return await getCart(req,res);
    }catch(err){
        
    }
};
