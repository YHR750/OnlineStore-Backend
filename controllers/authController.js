const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../connection');
const resHelper = require('../res');

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