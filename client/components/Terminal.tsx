"use client";
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function ForensicTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#0f172a', foreground: '#10b981' }, // Match slate-950 and emerald-500
      fontSize: 14,
      fontFamily: 'Courier New',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln('--- FORENSIC_PRO_TERMINAL v1.0.4 ---');
    term.writeln('Type "help" to see available forensic commands.');
    term.write('\r\n$ ');

    let currentLine = '';
    term.onData(e => {
      if (e === '\r') { // Enter key
        term.write('\r\n');
        handleCommand(currentLine, term);
        currentLine = '';
        term.write('$ ');
      } else if (e === '\u007f') { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        currentLine += e;
        term.write(e);
      }
    });

    return () => term.dispose();
  }, []);

  const handleCommand = (cmd: string, term: Terminal) => {
    const command = cmd.trim().toLowerCase();
    if (command === 'help') {
      term.writeln('Available: autopsy, wireshark --cli, fls, mactime, vol.py');
    } else if (command === 'autopsy') {
      term.writeln('Initializing Sleuth Kit engine... scanning /dev/sda1...');
    } else {
      term.writeln(`Command "${command}" not found. Initializing AI lookup...`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mt-8">
      <div className="flex items-center gap-2 mb-3 px-2">
        <div className="h-3 w-3 rounded-full bg-red-500"></div>
        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
        <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
        <span className="text-[10px] text-slate-500 font-mono ml-4 uppercase">investigator_cli_v1</span>
      </div>
      <div ref={terminalRef} className="h-64" />
    </div>
  );
}