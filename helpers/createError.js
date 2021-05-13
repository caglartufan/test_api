module.exports = function(message, statusCode) {
    return {
        error: {
            message: message,
            statusCode: statusCode
        }
    }
}