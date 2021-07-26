let mongoose = require('mongoose')



let userlist = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        
    },
    resetid: {
        type: String,
        default: "not yet reset"
    },

    activated:{
        type:Boolean,
        default:false,

    }

    

})

var userval = mongoose.model("userurls",userlist)

module.exports = { userval }