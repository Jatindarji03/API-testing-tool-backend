import axios from 'axios';
import admin from '../config/firebaseAdmin.js';
import User from '../models/user.Model.js'

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
            user:{
                email:response.data.email,
                uid:response.data.localId
            },
            tokenInfo:{
                token:response.data.idToken,
                refreshToken:response.data.refreshToken,
                expiresIn:response.data.expiresIn
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
export { signup, forgotPassword, signin };
