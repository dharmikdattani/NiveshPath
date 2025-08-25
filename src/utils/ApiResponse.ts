export class ApiResponse<T = unknown> {
    public statusCode: number;
    public success: boolean;
    public message: string;
    public data: T;

    constructor(statusCode: number, message = "Success", data: T) {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }
}
