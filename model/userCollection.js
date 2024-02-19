const mongoose=require ('mongoose');

mongoose.connect('mongodb+srv://johnashish509:ASHISH(123)(123)@shopcartify.kqkbee3.mongodb.net/ShopCartify', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>{
    console.log(" user's mongoDB connected")
}).catch(() => {
    console.log("failed to connect user's mongoDB");
    // console.log(error.mess);
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
  }],  
  redeemedCoupons: [
    {
        couponCode: {
            type: String,
        },
        redeemedAt: {
            type: Date,
            default: Date.now,
        },
    },
 ]

 });

  const userCollection=new mongoose.model("collectionOfUser",UserSchema)
module.exports=userCollection;