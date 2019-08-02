'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.notFound = notFound;
exports.catchAsync = catchAsync;
exports.catchErrors = catchErrors;
function notFound(req, res, next) {
    var err = new Error('404 page not found');
    err.status = 404;
    next(err);
}

function catchAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(function (err) {
            return next(err);
        });
    };
}

function catchErrors(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message
    });
}