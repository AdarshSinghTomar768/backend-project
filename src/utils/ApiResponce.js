class ApiResponse {
    constructor(
        statusCode,
        message = "Success",
        data = null
    ) {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }
}