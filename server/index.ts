import fs from 'fs';
import path from 'path';
import express from 'express';
import expressWs from 'express-ws';
import consola from 'consola';
import https from 'https';
import { openTerminal, resizeTerminal, connectTerminal } from './terminals';
const router = express();

router.get('/test', (req, res) => {
  res.send('AaaaBbbbb');
  res.end();
});

router.post('/terminals', (req, res) => {
  const cols = parseInt(req.query.cols, 10);
  const rows = parseInt(req.query.rows, 10);

  const term = openTerminal(cols, rows);

  res.send(term.pid.toString());
  res.end();
});

router.post('/terminals/:pid/size', (req, res) => {
  const pid = parseInt(req.params.pid, 10);
  const cols = parseInt(req.query.cols, 10);
  const rows = parseInt(req.query.rows, 10);

  resizeTerminal(pid, cols, rows);

  res.end();
});

// const wsApp = express() as unknown as expressWs.Application;
// expressWs(wsApp);
// wsApp.ws('/ws/terminals/:pid', (ws, req) => {
//   const pid = parseInt(req.params.pid, 10);
//   connectTerminal(ws, pid);
// });

// const keyPath = path.resolve(__dirname, 'server.key');
// const certPath = path.resolve(__dirname, 'server.crt');
// if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
//   const httpsServer = https.createServer({
//     key: fs.readFileSync(keyPath),
//     cert: fs.readFileSync(certPath),
//   }, wsApp);
//   httpsServer.listen(3001, '0.0.0.0');
//   wsApp.listen(3002, '0.0.0.0');
// } else {
//   wsApp.listen(3001, '0.0.0.0');
// }

module.exports = {
  path: '/api',
  handler: router,
};
