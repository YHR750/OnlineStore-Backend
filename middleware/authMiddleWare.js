const jwt = require('jsonwebtoken')

exports.authenticateToken = (req,res,next) =>{
    const authHeader = req.header['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token,'jwtsecret',(err,user)=>{
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

exports.authorizeRole = (role) =>(req,res,next) =>{
    if(req.user.role !== role) {
        return res.sendStatus(403).json({message:'access deny'});

    }
    next();
};