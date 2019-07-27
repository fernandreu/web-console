import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import express from 'express'
import expressWs from 'express-ws'
import { connectTerminal } from './terminals'

export default function() {
  let server = null;
  
  const keyPath = path.resolve(__dirname, 'server.key');
  const certPath = path.resolve(__dirname, 'server.crt');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    server = https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }, this.nuxt.renderer.app);
  } else {
    server = http.createServer(this.nuxt.renderer.app);
  }

  const app = express();
  expressWs(app, server);

  // overwrite nuxt.server.listen()
  this.nuxt.server.listen = (port, host) => new Promise(resolve => server.listen(port || process.env.NUXT_PORT || 3000, host || process.env.NUXT_HOST || 'localhost', resolve))
  
  // close this server on 'close' event
  this.nuxt.hook('close', () => new Promise(server.close))

  // Add express-ws events
  app.ws('/ws/terminals/:pid', (ws, req) => {
    const pid = parseInt(req.params.pid, 10);
    connectTerminal(ws, pid);
  });

}