export function notFound(req, res) {
  console.log('404', req.originalUrl, req.connection.remoteAddress);
  return res.status(404).sendFile(`${__dirname}/404.html`);
}

export async function catchErrors(err, req, res) {
  res.status(err.status || 500).send({
    message: err.message,
  });
}
