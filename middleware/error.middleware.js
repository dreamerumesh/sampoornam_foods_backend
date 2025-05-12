const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack); // Logs error for debugging

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Hide stack trace in production
    });
};

module.exports = errorMiddleware;
