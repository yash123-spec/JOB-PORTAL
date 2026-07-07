class ApiResponse {
    constructor(statusCode, data = null, message = "Success", errors = []) {
        if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) {
            throw new TypeError("statusCode must be a valid HTTP status code (100–599)")
        }

        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode >= 200 && statusCode < 300
        this.errors = errors
    }
}

export { ApiResponse }