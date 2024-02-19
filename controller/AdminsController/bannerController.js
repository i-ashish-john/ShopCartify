const bannerCollection = require('../../model/bannerCollection');

exports.BannerLoadPageInAdminSide = async(req,res)=>{
    try{
        console.log("reached");
        const admin =  req.session.admin;
        const Data = await bannerCollection.find();
        if(Data){
            console.log("the admin is:",admin);
            res.render("admin/bannerlist",{Data});
        }else{

        }
    }catch(error){
        console.log("erro in banner load");
        res.render('user/404');
        // console.log(error.message);
        // res.JSON.send({message:'error'});
    }
};
exports.AddBannerPageLoadInAdminSide = async(req,res)=>{
    try{
      res.render('admin/addbanner');
    }catch(error){
        console.log('error in adding page');
        res.send(error);
    }
};
exports.ForInsertingDetailsOfBanner = async(req,res)=>{
    try {
        console.log("reachedc");
        const { bannerTittle, bannerSubtittle, bannerUrl } = req.body;
        const imagePath = req.files['image'] ? req.files['image'][0].path : null;
        console.log(imagePath);

        const newBanner = new bannerCollection({
            bannerTittle,
            bannerSubtittle,
            bannerUrl,
            image: imagePath ? { data: imagePath, contentType: 'image/*' } : null,
        });
        
        await newBanner.save();
        res.redirect('/admin/bannerLoadPage');
        console.log("added successfully (banner)");
        // res.status(201).json({ message: 'Banner added successfully!' });
    } catch (error) {
        res.render('user/404');
        // console.error(error.message);
        // res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.EditBannerPageLoadingInAdminSide = async(req,res)=>{
    try{
        const params = req.params.id;
        const Data = await bannerCollection.findByIdAndDelete(params);
        console.log("params:",params);
        console.log('THE DATAS ARE :',Data);
        res.redirect('/admin/bannerLoadPage')//redirecting to the banner listing page itself
        
    }catch(error){
        res.render('user/404');
    // console.error(error);
    // console.log(error.message);

    }
}