import http from 'node:http';
import { config } from './config.js';
import { handleWebhook } from './webhook.js';

const server = http.createServer((req, res) => {
  if (req.url?.split('?')[0] !== '/webhook') {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not_found');
    return;
  }
  void handleWebhook(req, res);
});

server.listen(config.port, '0.0.0.0', () => {
  console.info(`WhatsApp webhook listening on port ${config.port}`);
});
