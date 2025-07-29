class ApiError extends error{
    constructor(statusCode,message="Something went wrong",errors=[],stack="")
    {
        super(message) //by default it will be "something went wrong" message to change value we super(message)"
        this.statusCode = statusCode
        this.data=null,
        this.message=message,
        this.success=false,
        this.errors=errors

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }   
}

export {ApiError}
