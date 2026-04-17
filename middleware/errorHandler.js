const errorHandler = (err,req,res,next)=>{
    return res.status(err.status || 500).json({
        success:false,
        message:err.message ?? 'Internal Server Error',
        ...(err.errors && {errors:err.errors})
    })
}

export default errorHandler ;