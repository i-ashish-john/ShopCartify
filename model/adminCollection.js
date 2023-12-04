const mongoose= require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/UntitledFolder")
.then(()=>{
    console.log("admin's mongoDB connected");
}).catch(()=>{
    console.log("failed to connect admin's mongoDB");
})

const AdminSchema=new mongoose.Schema({
    name:{
       type:String, 
       required:true
    },
    password:{
        type:String,
        required:true  
     },
     
});


const adminCollection=new mongoose.model("collectionOfAdmin",AdminSchema);
module.exports=adminCollection;