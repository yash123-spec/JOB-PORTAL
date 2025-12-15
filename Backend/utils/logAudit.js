import {AuditLog} from "../models/auditLog.model.js";

export const createAuditLog = async ({ userId, action, metadata = {} }) => {
  try {
    console.log("📋 createAuditLog CALLED with:", { userId, action, metadata });
    await AuditLog.create({ user: userId, action, metadata })
  } catch (error) {
    console.error("Failed to log audit:", error.message)
    // Optional: don't crash your main action due to audit failure
  }
}