import express from 'express'
import env from 'dotenv'
import cors from 'cors'
import { connectDB } from './config/connectDB.js'
import authRoute from './routes/auth.route.js'
import projectRoute from './routes/project.route.js'
import errorHandler from './middleware/errorHandler.js'
env.config()
const app = express()
app.use(express.json())
app.use(cors())


app.use('/api/auth',authRoute);
app.use('/api/project',projectRoute);
app.use(errorHandler)

const startServer = async () => {
    try {
        await connectDB();
        app.listen(process.env.PORT, () => {
            console.log(`server is started at this post ${process.env.PORT}`)
        });
    } catch (err) {
        console.log(`there is some error ${err}`)
    }
}
startServer()

