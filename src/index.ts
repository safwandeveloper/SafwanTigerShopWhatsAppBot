import http from 'node:http';
import { config } from './config.js';
import { handleWebhook } from './webhook.js';

const server = http.createServer((req, res) => {
  if (req.url?.split('?')[0] === '/privacy') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><title>Privacy Policy</title></head><body><h1>Privacy Policy</h1><p>This service processes WhatsApp messages sent to SafwanTigerShop to provide customer support and automated replies.</p><p>We do not sell personal information. Message data is used only to operate and improve the service, retained only as needed, and handled according to applicable law.</p><p>For privacy questions or deletion requests, contact support@safwantiger.com.</p></body></html>',
    );
    return;
  }

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
