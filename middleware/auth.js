const jwt = require('jsonwebtoken')

function extractToken(req){
    if(!req) return null;
    const headers = req.headers || {};
    const authHeader = headers.authorization || headers.Authorization;

    if (typeof authHeader === 'string'){
        const parts = authHeader.trim().split(/\s+s/);
        if(parts.length === 2 && parts[0].toLowerCase() === 'bearer'){
            return parts[1].trim();
        }
    }
    const xAccess = headers['x-access-token' || headers['X-Access-Token' || headers['xAccessToken']]];
    if(typeof xAccess === 'string' && xAccess.trim()) return xAccess.trim();

    const alt = headers['x-token'] || headers['x-auth-token'] || headers['token'];
    if(typeof alt === 'string' && alt.trim()) return alt.trim();


    if(req.cookies && req.cookies.token) return String(req.cookies.token).trim();
    
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
    /*try{
        const token = extractToken(req);
        if(!token) return res.status(401).json({error : 'authentication required'});
        const payload = verifyToken(token);
        req.user = payload;
        return next()
    }catch(err){
        console.error('auth.required error:', err.message || err);
        return res.status(401).json({error: 'invalid or expired token'});

    }*/

    const header = req.headers.authorization;
    if(!header) return res.status(401).json({error: 'authorization header missing'});

    const token = header.split('')[1];
    if(!token) return res.status(401).json({error:'token missing'});

    try{
        const decoded = jwt.verify(token, 'jwtsecret');
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).json({error:'invalid or expired token'});
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

function signToken(payload, opts = {}){
    const secret = process.env.JWT_SECRET;
    if(!secret) throw new Error('JWT_SECRET not sell in env');
    return jwt.sign(payload,secret, {expiresIn: opts.expiresIn || '7d'});
}

module.exports={
    require,
    optional,
    extractToken,
    verifyToken,
    signToken
};