import { Router } from "express";
import {signup,forgotPassword , signin,refreshToken,googleLogin} from '../controllers/auth.controller.js';

const authRoute = Router()

authRoute.post('/signup',signup);
authRoute.post('/forgot-password',forgotPassword);
authRoute.post('/signin',signin);
authRoute.post('/refresh-token',refreshToken);
authRoute.post('/google-login',googleLogin)
export default authRoute;