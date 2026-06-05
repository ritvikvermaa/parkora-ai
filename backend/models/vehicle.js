const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
{
    ownerName:{
        type:String,
        required:true
    },

    vehicleNumber:{
        type:String,
        required:true
    },

    vehicleType:{
        type:String,
        enum:["car","bike","visitor"],
        default:"car"
    },

    slot:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"ParkingSlot"
    },

    entryTime:{
        type:Date,
        default:Date.now
    },

    exitTime:{
        type:Date,
        default:null
    },

    isParked:{
        type:Boolean,
        default:true
    }

},
{timestamps:true}
)

module.exports =
  mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);