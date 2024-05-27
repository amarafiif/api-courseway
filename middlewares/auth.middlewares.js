const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
    restrict: async (req, res, next) => {
        let { authorization } = req.headers
        if (!authorization) {
          return res.status(401).json({
            status: false,
            message: "Unauthorized",
            error: "Token not found",
          });
        }
 
        let token = authorization.split(" ")[1]
        jwt.verify(token || authorization, JWT_SECRET_KEY, async (err, decoded) => {  
          if (err) {
                return res.status(401).json({
                    status: false,
                    message: 'Unauthorized',
                    err: err.message,
                    data: null
                });
            }

            req.user = await prisma.account.findUnique({
                where: {email: decoded.email}
              });
            next();
        });
    }
};