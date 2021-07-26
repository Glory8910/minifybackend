let mongoose=require("mongoose")



let schema={
    longurl:{
        type:String,
        required:true
    },
    shorturl:{
        type:String,
        unique:true
    },
    count:{
        type:Number,
        default:0
    }

}

let shoridurl=mongoose.model("nanos",schema);

module.exports={shoridurl}