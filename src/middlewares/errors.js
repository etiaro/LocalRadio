import express from 'express';

export function notFound(req, res, next) {
    console.log('404', req.originalUrl, req.connection.remoteAddress);
    return res.status(404).sendFile(__dirname + "/404.html");
    const err = new Error('404 page not found');
    err.status = 404;
    next(err);
}

export async function catchErrors(err, req, res, next) {
    res.status(err.status || 500).send({
        message: err.message
    });
}