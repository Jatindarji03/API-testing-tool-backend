import { Router } from "express";
import {signup,forgotPassword , signin} from '../controllers/auth.controller.js';

const authRoute = Router()

authRoute.post('/signup',signup);
authRoute.post('/forgot-password',forgotPassword);
authRoute.post('/signin',signin);

export default authRoute;