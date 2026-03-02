import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true,
        ref:'user'
    },
    projectName:{
        type:String,
        required:true
    }
},{timestamps:true});

 const projectModel = mongoose.model('project',projectSchema);
 export default projectModel ;