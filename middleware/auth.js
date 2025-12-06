const jwt = require('jsonwebtoken')

function extractToken(req){
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && authHeader.split && authHeader.split('')[0].toLowerCase() === 'bearer'){
        return authHeader.split('')[1];
    }
    if(req.headers['x-access-token']) return req.headers['x-access-token'];

    if(req.cookies && req.cookies.token) return req.cookies.token;
    
    return null;
}

function verifyToken(token){
    if(!token) throw new Error('no token');
    const secret = 'jwtsecret';
    if(!secret) throw new Error('JWT_SECRET not sel in env');
    const payload = jwt.verify(token,secret);
    return payload;
}

function require(req,res,next){
    try{
        const token = extractToken(req);
        if(!token) return res.status(401).json({error : 'authentication required'});
        const payload = verifyToken(token);
        req.user = payload;
        return next()
    }catch(err){
        console.error('auth.required error:', err.message || err);
        return res.status(401).json({error: 'invalid or expired token'});

    }
}

function optional(req,res,next){
    try{
        const token = extractToken(req);
        if(!token) return next();
        const payload = verifyToken(token);
        req.user = payload;        
    }catch(err){
        console.warn('auth.optional: token invalid or missing');
    }
    return next();
}
