class AppError extends Error {
    constructor(message,status,errors=null){
        super(message);
        this.message = message;
        this.status=status;
        this.errors=errors;
    }
}

export default AppError;