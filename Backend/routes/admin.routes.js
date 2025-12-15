import express from "express";
import { getAllUsers, deleteUserByAdmin,getAllJobsForAdmin, 
    deleteJobByAdmin,updateUserRole,toggleUserStatus, getAdminStats,getAuditLogs } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.middleware.js";



const adminRouter = express.Router();

adminRouter.get("/admin/users", verifyJWT, authorizeRoles("admin"), getAllUsers);
adminRouter.delete("/admin/users/:id", verifyJWT, authorizeRoles("admin"), deleteUserByAdmin);
adminRouter.get("/admin/job", verifyJWT, authorizeRoles("admin"), getAllJobsForAdmin);
adminRouter.delete("/admin/job/:id", verifyJWT, authorizeRoles("admin"), deleteJobByAdmin);
adminRouter.patch("/admin/user/:id/role",verifyJWT,authorizeRoles("admin"),updateUserRole)
adminRouter.patch("/admin/user/:id/status",verifyJWT,authorizeRoles("admin"),toggleUserStatus)
adminRouter.get("/admin/user/stats",verifyJWT,authorizeRoles("admin"),getAdminStats)
adminRouter.get("/admin/user/auditLogs",verifyJWT,authorizeRoles("admin"),getAuditLogs)

export default adminRouter;
