import axios from "axios";
import admin from "../config/firebaseAdmin.js";
import User from "../models/user.model.js";
import { OAuth2Client } from "google-auth-library";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import AppResponse from "../utils/AppResponse.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/*
    this method will create a new user in firebase auth
    as well as create a doc in user collection.
*/
const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email And Password Are Required", 400);
  }
  const userRecord = await admin.auth().createUser({
    email: email,
    password: password,
    emailVerified: false,
    disabled: false,
  });

  await new User({ email: userRecord.email, uid: userRecord.uid })
    .save()
    .catch(async () => {
      await admin.auth().deleteUser(userRecord.uid);
      throw new AppError("Database Error Rollback Completed", 500);
    });
  return AppResponse.success(
    res,
    { uid: userRecord.uid, email: userRecord.email },
    "User Created Successfuly",
    201,
  );
});
/*
    this method will send reset password link into register
    mail id.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is Required", 400);
  }
  await admin
    .auth()
    .getUserByEmail(email)
    .catch((err) => {
      throw new AppError("Email is not registered", 400);
    });
  await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${process.env.FIREBASE_API_KEY}`,
    {
      requestType: "PASSWORD_RESET",
      email: email,
    },
  );
  return AppResponse.success(res, {}, "Password reset email is sent");
});
/*
    this method will signin and return token realted 
    details.
*/
const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const response = await axios
    .post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      },
    )
    .catch((err) => {
      throw new AppError("Invalid Email or Password", 401, err);
    });
  return AppResponse.success(
    res,
    {
      user: {
        email: response.data.email,
        uid: response.data.localId,
      },
      tokenInfo: {
        token: response.data.idToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      },
    },
    "Login Successfully",
    200,
  );
});

/*
    this method will genrate a new token from refresh token
    in every 1 hour.
*/
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }
  const response = await axios
    .post(
      `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
    )
    .catch((err) => {
      throw new AppError(
        "There is something error while genrating refresh token",
        400,
      );
    });

  return AppResponse.success(
    res,
    {
      tokenInfo: {
        token: response.data.id_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      },
    },
    "Token refreshed successfully",
    200,
  );
});

const googleLogin = asyncHandler(async (req, res) => {
  const { googleToken } = req.body;
  if (!googleToken) {
    throw new AppError("Google token is required", 400);
  }

  // verify google token
  const ticket = await client
    .verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    .catch((err) => {
      throw new AppError("Invalid Google token", 401);
    });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  //create firebase user

  const firebaseUser = await admin.auth()
    .getUserByEmail(email)
    .catch((err) =>
      admin
        .auth()
        .createUser({ email: email,displayName:name, photoURL: picture }),
    );

  // create data in db
  let userDB = await User.findOne({ uid: firebaseUser.uid });
  if (!userDB) {
    userDB = new User({
      email: firebaseUser.email,
      uid: firebaseUser.uid,
    });
    await userDB.save().catch((err) => {
      throw new AppError("Database error while saving user", 500);
    });
  }

  //Here code is left .. -> to be implemenet.
  const customToken = await admin
    .auth()
    .createCustomToken(firebaseUser.uid)
    .catch(() => {
      throw new AppError("Error while genrating token", 500);
    });

  const response = await axios
    .post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_API_KEY}`,
      {
        token: customToken,
        returnSecureToken: true,
      },
    )
    .catch(() => {
      throw new AppError("Authentication failed", 401);
    });
  return AppResponse.success(
    res,
    {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      },
      tokens: {
        idToken: response.data.idToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      },
    },
    "Google login successful",
    200,
  );
});
export { signup, forgotPassword, signin, refreshToken, googleLogin };
