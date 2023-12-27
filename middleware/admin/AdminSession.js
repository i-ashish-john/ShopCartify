const AdminSession = async(req,res,next)=>{
        try{
           if(req.session.admin){
            next();

           } else{
             res.redirect('/admin/login');
           }
        }catch(error){
            next(error);

        }
};
module.exports = AdminSession;