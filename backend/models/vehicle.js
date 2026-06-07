const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({

    number:{
        type:String,
        required:true,
        unique:true
    },

    manufacturer:{
        type:String,
        required:true
    },

    model:{
        type:String,
        required:true
    },

    type:{
        type:String,
        enum:["car","bike","ev","other"],
        required:true
    },

    flat:{
        type:String,
        required:true
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    slot:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ParkingSlot"
    },

    isParked:{
        type:Boolean,
        default:false
    }

},{
    timestamps:true
})

module.exports =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);