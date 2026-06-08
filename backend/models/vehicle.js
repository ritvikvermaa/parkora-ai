const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({

    ownerName:{
        type:String,
        default:""
    },

    number:{
        type:String,
        required:true,
        unique:true
    },

    vehicleNumber:{
        type:String,
        required:true
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

    vehicleType:{
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
    },

    parkingCategory:{
        type:String,
        enum:["resident","visitor"],
        default:"resident"
    },

    entrySource:{
        type:String,
        enum:["resident","visitor_invite","guard_request","admin"],
        default:"resident"
    },

    entryTime:{
        type:Date,
        default:null
    },

    exitTime:{
        type:Date,
        default:null
    }

},{
    timestamps:true
})

module.exports =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
