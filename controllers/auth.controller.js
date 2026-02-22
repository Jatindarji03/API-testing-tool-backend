import axios from 'axios';
import admin from '../config/firebaseAdmin.js';
import User from '../models/user.Model.js'
import { OAuth2Client } from 'google-auth-library';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
    this method will create a new user in firebase auth
    as well as create a doc in user collection.
*/
const signup = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            emailVerified: false,
            disabled: false
        });
    } catch (err) {
        throw new ApiError(400, err.message || "Unable to create user");
    }

    try {
        const userDB = new User({
            email: userRecord.email,
            uid: userRecord.uid
        });
        await userDB.save();
    } catch (_err) {
        await admin.auth().deleteUser(userRecord.uid);
        throw new ApiError(500, "Database error. User rollback completed.");
    }

    return sendSuccess(res, 201, "User created successfully", {
        uid: userRecord.uid,
        email: userRecord.email,
    });
});
/*
    this method will send reset password link into register
    mail id.
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    try {
        await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
            {
                requestType: "PASSWORD_RESET",
                email,
            }
        );
    } catch (err) {
        const firebaseMessage = err?.response?.data?.error?.message || err.message;
        throw new ApiError(400, firebaseMessage || "Unable to send reset email");
    }

    return sendSuccess(res, 200, "Password reset email sent");
});
/*
    this method will signin and return token realted 
    details.
*/
const signin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    let response;
    try {
        response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                email,
                password,
                returnSecureToken: true,
            }
        );
    } catch (err) {
        const firebaseError = err?.response?.data?.error?.message || "Something went wrong";
        const errorMap = {
            INVALID_LOGIN_CREDENTIALS: "Invalid email or password",
            EMAIL_NOT_FOUND: "User not found",
            INVALID_PASSWORD: "Wrong password",
            USER_DISABLED: "Account disabled",
        };
        throw new ApiError(400, errorMap[firebaseError] || firebaseError);
    }

    return sendSuccess(res, 200, "Login successful", {
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
});

/*
    this method will genrate a new token from refresh token
    in every 1 hour.
*/
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken: incomingRefreshToken } = req.body;
    if (!incomingRefreshToken) {
        throw new ApiError(400, "Refresh token is required");
    }

    let response;
    try {
        response = await axios.post(
            `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
            {
                grant_type: "refresh_token",
                refresh_token: incomingRefreshToken,
            }
        );
    } catch (err) {
        const firebaseMessage = err?.response?.data?.error?.message || err.message;
        throw new ApiError(400, firebaseMessage || "Unable to refresh token");
    }

    return sendSuccess(res, 200, "Token refreshed successfully", {
        tokens: {
            idToken: response.data.id_token,
            refreshToken: response.data.refresh_token,
            expiresIn: response.data.expires_in,
        },
    });
});

const googleLogin = asyncHandler(async (req, res) => {
    const { googleToken } = req.body;
    if (!googleToken) {
        throw new ApiError(400, "Google token is required");
    }

    try {
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
        return sendSuccess(res, 200, "Google login successful", {
            user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
            },
            tokens: {
                idToken: response.data.idToken,
                refreshToken: response.data.refreshToken,
                expiresIn: response.data.expiresIn,
            },
        });
    } catch (err) {
        throw new ApiError(401, "Google authentication failed", err.message);
    }
});
export { signup, forgotPassword, signin, refreshToken, googleLogin };
