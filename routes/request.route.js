import { Router } from "express";
import { sendRequest } from "../controllers/request.controller.js";
const requestRouter =  Router();

requestRouter.post('/send',sendRequest);
export default requestRouter;