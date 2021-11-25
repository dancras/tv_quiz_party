// TS versions of this file unsupported in this version but there is a merged
// change waiting for release so we'll keep this here.
import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware'

module.exports = function(app: Express) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://flask_backend:5000',
      changeOrigin: true,
    })
  );
};
