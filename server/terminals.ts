import * as pty from './pty-import';
import consola from 'consola';
import { Dictionary } from '@nuxt/vue-app';
import { IPty } from 'node-pty';

if (pty === undefined) {
  throw new Error('pty is undefined');
}

/**
 * Whether to use UTF8 binary transport.
 * (Must also be switched in client.ts)
 */
const USE_BINARY_UTF8 = false;

const terminals: Dictionary<IPty> = {};
const logs: Dictionary<string> = {};

export function openTerminal(cols: number, rows: number) {
  const env = Object.assign({}, process.env);
  env.COLORTERM = 'truecolor';
  let proc: string;
  if (env.XTERM_SHELL !== undefined) {
    proc = env.XTERM_SHELL;
  } else if (process.platform === 'win32') {
    proc = 'cmd.exe';
  } else {
    proc = 'bash';
  }

  consola.info(`xterm shell being used: ${proc}`);

  let args = [];
  if (proc === 'bash') {
    args = [ '--init-file', __dirname + '/.bashrc' ];
  }

  const term = pty.spawn(
    proc,
    args,
    {
      name: 'xterm-256color',
      cols: cols || 80,
      rows: rows || 24,
      cwd: env.PWD,
      env: env as Dictionary<string>,
      encoding: USE_BINARY_UTF8 ? undefined : 'utf8',
    });

  consola.info(`Created terminal with PID: ${term.pid}`);
  terminals[term.pid] = term;
  logs[term.pid] = '';
  term.on('data', (data) => {
    logs[term.pid] += data;
  });

  return term;
}

export function resizeTerminal(pid: number, cols: number, rows: number) {
  const term = terminals[pid];
  term.resize(cols, rows);
  consola.info(`Resized terminal ${pid} to ${cols} cols and ${rows} rows`);
  return term;
}

export function connectTerminal(ws, pid: number) {
  const term = terminals[pid];
  consola.info(`Connected to terminal ${term.pid}`);
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
    let bufferArray = [];
    let sender = null;
    let length = 0;
    return (data) => {
      bufferArray.push(data);
      length += data.length;
      if (!sender) {
        sender = setTimeout(() => {
          socket.send(Buffer.concat(bufferArray, length));
          bufferArray = [];
          sender = null;
          length = 0;
        }, timeout);
      }
    };
  }
  const send = USE_BINARY_UTF8 ? bufferUtf8(ws, 5) : buffer(ws, 5);

  term.on('data', (data) => {
    // console.log(`onData: ${data}`);
    try {
      send(data);
    } catch (ex) {
      // The WebSocket is not open, ignore
    }
  });
  ws.on('message', (msg) => {
    // console.log(`onMessage: ${msg}`);
    term.write(msg);
  });
  ws.on('close', () => {
    term.kill();
    consola.info(`Closed terminal ${term.pid}`);
    // Clean things up
    delete terminals[term.pid];
    delete logs[term.pid];
  });

  return term;
}
