const pty = require('node-pty');
const express = require('express');
const expressWs = require('express-ws');
const consola = require('consola');
const { Nuxt, Builder } = require('nuxt');
const app = express();
expressWs(app);

/**
 * Whether to use UTF8 binary transport.
 * (Must also be switched in client.ts)
 */
const USE_BINARY_UTF8 = false;

// Import and Set Nuxt.js options
const config = require('../nuxt.config.ts')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  var terminals = {},
      logs = {};

  app.post('/terminals', function (req, res) {
    const env = Object.assign({}, process.env);
    env['COLORTERM'] = 'truecolor';
    let proc;
    let args;
    if (process.platform === 'win32') {
      proc = 'cmd.exe';
      args = [];
    } else {
      proc = 'bash';
      args = [ '--init-file', __dirname + '/.bashrc' ];
    }
    const cols = parseInt(req.query.cols);
    const rows = parseInt(req.query.rows);

        term = pty.spawn(
          proc, 
          args,
          {
            name: 'xterm-256color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: env.PWD,
            env: env,
            encoding: USE_BINARY_UTF8 ? null : 'utf8'
          });

    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${timestamp} ${req.ip}] Created terminal with PID: ${term.pid}`);
    terminals[term.pid] = term;
    logs[term.pid] = '';
    term.on('data', function(data) {
      logs[term.pid] += data;
    });
    res.send(term.pid.toString());
    res.end();
  });

  app.post('/terminals/:pid/size', function (req, res) {
    const pid = parseInt(req.params.pid);
    const cols = parseInt(req.query.cols);
    const rows = parseInt(req.query.rows);
    const term = terminals[pid];

    term.resize(cols, rows);
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${timestamp} ${req.ip}] Resized terminal ${pid} to ${cols} cols and ${rows} rows`);
    res.end();
  });

  app.ws('/terminals/:pid', function (ws, req) {
    var term = terminals[parseInt(req.params.pid)];
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${timestamp} ${req.ip}] Connected to terminal ${term.pid}`);
    ws.send(logs[term.pid]);

    // string message buffering
    function buffer(socket, timeout) {
      let s = '';
      let sender = null;
      return (data) => {
        s += data;
        if (!sender) {
          sender = setTimeout(() => {
            socket.send(s);
            s = '';
            sender = null;
          }, timeout);
        }
      };
    }
    // binary message buffering
    function bufferUtf8(socket, timeout) {
      let buffer = [];
      let sender = null;
      let length = 0;
      return (data) => {
        buffer.push(data);
        length += data.length;
        if (!sender) {
          sender = setTimeout(() => {
            socket.send(Buffer.concat(buffer, length));
            buffer = [];
            sender = null;
            length = 0;
          }, timeout);
        }
      };
    }
    const send = USE_BINARY_UTF8 ? bufferUtf8(ws, 5) : buffer(ws, 5);

    term.on('data', function(data) {
      // console.log(`onData: ${data}`);
      try {
        send(data);
      } catch (ex) {
        // The WebSocket is not open, ignore
      }
    });
    ws.on('message', function(msg) {
      // console.log(`onMessage: ${msg}`);
      term.write(msg);
    });
    ws.on('close', function () {
      term.kill();
      const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
      console.log(`[${timestamp} ${req.ip}] Closed terminal ${temp.pid}`);
      // Clean things up
      delete terminals[term.pid];
      delete logs[term.pid];
    });
  });

  // Give nuxt middleware to express
  app.use(nuxt.render)
  
  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
