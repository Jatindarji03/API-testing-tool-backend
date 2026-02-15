import mongoose from "mongoose";

export const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.DB_URL);
        console.log('connected to DB');
    }catch(err){
        console.log(`there is some error to connect DB ${err}`);
        throw err;
    }
}
