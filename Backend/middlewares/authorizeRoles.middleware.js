export const authorizeRoles = (...roles) =>{
    return (req,res,next)=>{
        if(!roles.includes(req.user?.role)){
            return res.status(403).json({
                success:false,
                message:`Only ${roles.join(", ")} role(s) are allowed to access this resource`
            })
        }
        next()
    }
}