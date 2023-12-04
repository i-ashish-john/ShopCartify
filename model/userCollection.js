const mongoose=require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/UntitledFolder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>{
    console.log(" user's mongoDB connected")
}).catch(() => {
    console.log("failed to connect user's mongoDB");
});
const UserSchema=new mongoose.Schema({
    name:{
      type:String,
      required:true,
    },
    email:{
      type:String,
      required:true,
    },
    password:{
        type:String,
        required:true,
    },
    otp: {
      type: String, 
      default: null,
    },
    isblocked: {
      type: Boolean,  
      default: false  
  },

  address:[{
    street: {   
      type: String, 
      required: true
  },
  country: {
      type: String,
      required: true
  },
  city: {
      type: String,
      required: true
  },
  state: {
      type: String,
      required: true
  },
  zip: {
      type: String,
      required: true
  }
  }]
 });

  const userCollection=new mongoose.model("collectionOfUser",UserSchema)
module.exports=userCollection;