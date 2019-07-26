import express from 'express';
import { openTerminal, resizeTerminal } from './terminals';
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

module.exports = {
  path: '/api',
  handler: router,
};
