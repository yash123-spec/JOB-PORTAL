import mongoose from "mongoose"

const auditLogSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    action:{
        type:String,  // e.g. 'CREATE_JOB', 'DELETE_JOB
        required:true
    },
    metadata:{
        type:Object,  // any additional info like jobId, old data, etc.
        default:{}
    }
},{timestamps:true})


export const AuditLog = mongoose.model("AuditLog",auditLogSchema)
