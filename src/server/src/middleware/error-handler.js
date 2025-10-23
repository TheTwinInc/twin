(function () {
    module.exports = errorHandler;

    // function errorHandler(err, req, res, next) {
    //     if (typeof (err) === 'string') {
    //         // custom application error
    //         return res.status(400).json({ message: err });
    //     }

    //     if (err.name === 'UnauthorizedError') {
    //         // jwt authentication error
    //         return res.status(401).json({ message: 'Invalid Token' });
    //     }

    //     // default to 500 server error
    //     return res.status(500).json({ message: err.message });
    // }

    function errorHandler(err, req, res, next) {
        switch (true) {
            case typeof err === 'string':
                // custom application error
                const is404 = err.toLowerCase().endsWith('not found');
                const statusCode = is404 ? 404 : 400;
                return res.status(statusCode).json({ message: err });
            case err.name === 'ValidationError':
                // schema validation error
                return res.status(400).json({ message: err.message });
            case err.name === 'UnauthorizedError':
                // jwt authentication error
                return res.status(401).json({ message: 'Unauthorized Error' });
            default:
                return res.status(500).json({ message: err.message });
        }
    }
}());
