import axios from 'axios';
import admin from '../config/firebaseAdmin.js';
import User from '../models/user.Model.js'
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
    this method will create a new user in firebase auth
    as well as create a doc in user collection.
*/
const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            })
        }
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            emailVerified: false,
            disabled: false
        })
        try {
            const userDB = new User({
                email: userRecord.email,
                uid: userRecord.uid
            });
            await userDB.save();
        } catch (err) {
            await admin.auth().deleteUser(userRecord.uid);
            return res.status(500).json({
                success: false,
                message: "Database error. User rollback completed.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            uid: userRecord.uid,
            email: userRecord.email,
        })
    } catch (err) {
        console.log(`firebase error ${err}`)
        return res.status(400).json({
            success: false,
            message: err.message,
        })
    }
}
/*
    this method will send reset password link into register
    mail id.
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            })
        }
        await axios.post(`
            https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
            {
                requestType: "PASSWORD_RESET",
                email: email,
            });
        return res.status(200).json({
            success: true,
            message: "Password reset email sent",
        });
    } catch (err) {
        console.log(`there is something error ${err}`)
        return res.status(400).json({
            success: false,
            message: err.message,
        })
    }
}
/*
    this method will signin and return token realted 
    details.
*/
const signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            })
        }

        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true,
            }
        )
        return res.status(200).json({
            success: true,
            message: 'login successfully',
            user: {
                email: response.data.email,
                uid: response.data.localId
            },
            tokenInfo: {
                token: response.data.idToken,
                refreshToken: response.data.refreshToken,
                expiresIn: response.data.expiresIn
            }
        });
    } catch (err) {
        console.log(`there is something error ${err}`)
        return res.status(400).json({
            success: false,
            message: err.message,
        })

    }
}

/*
    this method will genrate a new token from refresh token
    in every 1 hour.
*/
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            })
        }
        const response = await axios.post(
            `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
            {
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }
        )
        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            tokens: {
                idToken: response.data.id_token,
                refreshToken: response.data.refresh_token,
                expiresIn: response.data.expires_in,
            },
        })
    } catch (err) {
        console.log(`there is some error ${err}`)
    }
}

const googleLogin = async (req, res) => {
    try {
        const { googleToken } = req.body;
        if (!googleToken) {
            return res.status(400).json({
                success: false,
                message: "Google token is required",
            });
        }

        // verify google token 
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        //create firebase user
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(email);
        } catch (err) {
            firebaseUser = await admin.auth().createUser({
                email: email,
                displayName: name,
                photoURL: picture
            });

        }

        // create data in db 
        let userDB = await User.findOne({ uid: firebaseUser.uid });
        if (!userDB) {
            userDB = new User({
                email: firebaseUser.email,
                uid: firebaseUser.uid
            });
            await userDB.save();
        }

        const customToken = await admin.auth().createCustomToken(firebaseUser.uid);

        const response = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
            {
                token: customToken,
                returnSecureToken: true,
            })
        return res.status(200).json({
            success: true,
            message: "Google login successful 🎉",
            user: {
                uid: response.data.localId,
                email: response.data.email,
            },
            tokens: {
                idToken: response.data.idToken,
                refreshToken: response.data.refreshToken,
                expiresIn: response.data.expiresIn,
            },
        });
    } catch (err) {
        console.log(`there is some error in google login ${err}`);
        return res.status(401).json({
            success: false,
            message: "Google authentication failed",
        });
    }
}
export { signup, forgotPassword, signin, refreshToken ,googleLogin };