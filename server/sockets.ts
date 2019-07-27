import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import expressWs from 'express-ws';
import { connectTerminal } from './terminals';

/**
 * Fake replica of Nuxt's Listener. When added to the server listeners, the console
 * will properly say the "Listening on: <clickable url>" message.
 */
class FakeListener {
  public host: string;

  public port: string;

  public listening = true;

  public url: string;

  constructor(protocol, host, port, baseURL = '') {
    this.host = host;
    this.port = port;
    this.url = `${protocol}://${this.host}:${this.port}${baseURL}`;
  }

  public listen() {/**/}

  public close() {/**/}
}

export default function() {
  let server = null;

  const keyPath = path.resolve(__dirname, 'server.key');
  const certPath = path.resolve(__dirname, 'server.crt');
  let protocol: string;
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    server = https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }, this.nuxt.renderer.app);
    protocol = 'https';
  } else {
    server = http.createServer(this.nuxt.renderer.app);
    protocol = 'http';
  }

  const app = express() as unknown as expressWs.Application;
  expressWs(app, server);

  // overwrite nuxt.server.listen()
  this.nuxt.server.listen = async (port: string, host: string, socket: string) => {
    const actualPort = isNaN(parseInt(port, 10)) ? this.options.server.port : port;
    const actualHost = host || this.options.server.host;
    await server.listen(actualPort, actualHost);
    const listener = new FakeListener(
      protocol,
      actualHost,
       actualPort,
        this.options.router.base,
    );

    this.nuxt.server.listeners.push(listener);

    return listener;
  };

  // close this server on 'close' event
  this.nuxt.hook('close', () => new Promise(server.close));

  // Add express-ws events
  app.ws('/ws/terminals/:pid', (ws, req) => {
    const pid = parseInt(req.params.pid, 10);
    connectTerminal(ws, pid);
  });
}
