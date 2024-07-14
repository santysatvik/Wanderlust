const Listing=require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken});

module.exports.index=async(req,res )=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}

module.exports.renderNewForm=(req,res)=>{
   
    res.render("listings/new.ejs");
}
 module.exports.createListing=async(req,res)=>{
    let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 2
      })
        .send();

    let url=req.file.path;
    let filename=req.file.filename;
    let listing=new Listing(req.body.listing);
    listing.owner=req.user._id;
    listing.image={url,filename};
    listing.geometry=response.body.features[0].geometry;
    let savedListing=await listing.save();
    req.flash("success","New Listing Created");
    res.redirect("/listings")

}

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"reviews",
        populate:{
            path:'author',
        },
    })
    .populate("owner")
    ;
    if(!listing){
        req.flash("error","Link you Requested does not exist");
        res.redirect("/listings")
    }
    res.render("listings/show.ejs",{listing});

}


module.exports.renderEditForm=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Link you Requested does not exist");
        res.redirect("/listings");
    }
    let orignalImageUrl=listing.image.url;
    orignalImageUrl= orignalImageUrl.replace("/upload", "/upload/h_100,w_100");
    res.render("listings/edit.ejs",{listing,orignalImageUrl});
}

module.exports.updateListing=async(req,res)=>{
    let {id}=req.params;
    
    let listing=await Listing.findByIdAndUpdate(id,{ ...req.body.listing});
    if(req.file){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();

    }
   
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);

}

module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");

}