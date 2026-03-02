import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    uid:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true
    }

},{timestamps:true})

const user = mongoose.model('user',userSchema);
export default user;
