<template>
  <div ref="xterm"/>
</template>

<script lang="ts">
import 'xterm/css/xterm.css';
import { Terminal, ITerminalOptions } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon, ISearchOptions } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { WebglAddon } from 'xterm-addon-webgl';

import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class VueTerminal extends Vue {
  private port: string = location.port;

  private initialized: boolean = false;
  private term!: Terminal;
  private terminalContainer!: HTMLElement;
  private socket!: WebSocket;
  private fitAddon!: FitAddon;
  private searchAddon!: SearchAddon;
  private pid!: number
  private protocol!: any;
  private socketUrl!: string

  mounted() {
    this.terminalContainer = this.$refs.xterm as HTMLElement;
    this.createTerminal();
  }
  
  destroyed() {
    window.removeEventListener('resize', this.fitAddon.fit);
  }

  private createTerminal(): void {
    // Clean terminal
    while (this.terminalContainer.children.length) {
      this.terminalContainer.removeChild(this.terminalContainer.children[0]);
    }

    const isWindows = ['Windows', 'Win16', 'Win32', 'WinCE'].indexOf(navigator.platform) >= 0;
    this.term = new Terminal({
      windowsMode: isWindows
    } as ITerminalOptions);

    // Load addons
    this.term.loadAddon(new WebLinksAddon());
    this.searchAddon = new SearchAddon();
    this.term.loadAddon(this.searchAddon);
    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);

    this.term.onResize((size: { cols: number, rows: number }) => {
      if (!this.pid) {
        return;
      }
      const cols = size.cols;
      const rows = size.rows;
      fetch('/terminals/' + this.pid + '/size?cols=' + cols + '&rows=' + rows, {method: 'POST'});
    });
    this.protocol = (location.protocol === 'https:') ? 'wss://' : 'ws://';
    this.socketUrl = this.protocol + location.hostname + ((this.port) ? (':' + this.port) : '') + '/terminals/';

    this.term.open(this.terminalContainer);
    this.fitAddon.fit();
    this.term.focus();

    window.addEventListener('resize', this.fitAddon.fit);

    // this.addDomListener(paddingElement, 'change', setPadding);

    // this.addDomListener(actionElements.findNext, 'keyup', (e) => {
    //   const searchOptions = getSearchOptions();
    //   searchOptions.incremental = e.key !== `Enter`;
    //   searchAddon.findNext(actionElements.findNext.value, searchOptions);
    // });

    // this.addDomListener(actionElements.findPrevious, 'keyup', (e) => {
    //   if (e.key === `Enter`) {
    //     searchAddon.findPrevious(actionElements.findPrevious.value, getSearchOptions());
    //   }
    // });

    // fit is called within a setTimeout, cols and rows need this.
    setTimeout(() => {
      // initOptions(term);
      // // TODO: Clean this up, opt-cols/rows doesn't exist anymore
      // (<HTMLInputElement>document.getElementById(`opt-cols`)).value = this.term.cols;
      // (<HTMLInputElement>document.getElementById(`opt-rows`)).value = this.term.rows;
      // paddingElement.value = '0';

      // Set terminal size again to set the specific dimensions on the demo
      // updateTerminalSize();

      fetch(`/terminals?cols=${this.term.cols}&rows=${this.term.rows}`, {method: 'POST'}).then((res) => {
        res.text().then((processId) => {
          console.log(`processId: ${processId}`)
          this.pid = parseInt(processId);
          this.socketUrl += this.pid;
          console.log(`socketUrl: ${this.socketUrl}`);
          this.socket = new WebSocket(this.socketUrl);
          this.socket.onopen = () => this.runRealTerminal();
          this.socket.onclose = () => this.runFakeTerminal();
          this.socket.onerror = () => this.runFakeTerminal();
        });
      });
    }, 0);
  }
  
  private runRealTerminal(): void {
    /**
     * The demo defaults to string transport by default.
     * To run it with UTF8 binary transport, swap comment on
     * the lines below. (Must also be switched in server.js)
     */
    this.term.loadAddon(new AttachAddon(this.socket));
    // term.loadAddon(new AttachAddon(socket, {inputUtf8: true}));

    this.initialized = true;
  }

  private runFakeTerminal(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const term = this.term as any;
    term.prompt = () => {
      term.write('\r\n$ ');
    };

    term.writeln('Welcome to xterm.js');
    term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
    term.writeln('Type some keys and commands to play around.');
    term.writeln('');
    term.prompt();

    term.onKey((e: { key: string, domEvent: KeyboardEvent }) => {
      const ev = e.domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

      if (ev.keyCode === 13) {
        term.prompt();
      } else if (ev.keyCode === 8) {
      // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          term.write('\b \b');
        }
      } else if (printable) {
        term.write(e.key);
      }
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
