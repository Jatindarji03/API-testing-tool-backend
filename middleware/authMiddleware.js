import admin from '../config/firebaseAdmin.js';

/*this middleware will verify token
 that will provided from client.*/
export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (err) {
        console.log(`there is some error in middleware ${err}`);
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Invalid or expired token",
        });
    }
}
