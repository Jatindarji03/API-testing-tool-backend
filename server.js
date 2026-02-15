import express from 'express'
import env from 'dotenv'
import cors from 'cors'
import { connectDB } from './config/connectDB.js'

const app = express()
env.config()
app.use(express.json())

app.get('/', (req, res) => {
    res.json({
        message: "API is working 🚀"
    })
})
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
    try {
        await connectDB();
        console.log(`Server running on http://localhost:${PORT}`)
    } catch (err) {

    }

})
