class ApiError extends Error {
    public statusCode: number;
    public data: unknown;
    public success: boolean;
    public errors: string[] | object[];

    constructor(
        statusCode: number,
        message = "Something went wrong",
        errors: string[] | object[] = [],
        stack = ""
    ) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype); // ✅ Restore prototype chain

        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
