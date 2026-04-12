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
    switch (command) {
      case 'help':
        term.writeln('Commands: autopsy, wireshark --cli, fls <image>, mactime, vol.py --info, hash <file>, clear');
        break;
      case 'autopsy':
        term.writeln('[*] Initializing Sleuth Kit engine...');
        term.writeln('[*] Mounting /dev/sda1 as read-only...');
        term.writeln('[+] Partition table: MBR | 3 partitions found');
        term.writeln('[+] File system: NTFS (offset 2048)');
        term.writeln('[!] 4 deleted files recoverable in $Recycle.Bin');
        term.writeln('[+] Scan complete. Open Autopsy GUI for full report.');
        break;
      case 'wireshark --cli':
        term.writeln('[*] Capturing on eth0 (promiscuous mode)...');
        term.writeln('  Frame 1: 192.168.1.5 -> 8.8.8.8  DNS Query: forensics.gov');
        term.writeln('  Frame 2: 8.8.8.8 -> 192.168.1.5  DNS Response: 142.250.80.46');
        term.writeln('  Frame 3: 192.168.1.5 -> 142.250.80.46  TCP SYN');
        term.writeln('[!] Suspicious outbound connection on port 4444 detected.');
        break;
      case 'fls':
      case 'fls <image>':
        term.writeln('r/r 5:    $MFT');
        term.writeln('r/r 6:    $MFTMirr');
        term.writeln('d/d 11:   $Orphan');
        term.writeln('r/r 128:  evidence.dd');
        term.writeln('r/r 129:  suspect_chat_logs.txt (deleted)');
        term.writeln('r/r 130:  payload.exe (deleted)');
        break;
      case 'mactime':
        term.writeln('Mon Jan 13 2025 09:14:22  4096 m... d/d 11  /evidence');
        term.writeln('Mon Jan 13 2025 09:15:01  2048 .a.. r/r 128 /evidence/suspect_chat_logs.txt');
        term.writeln('Mon Jan 13 2025 09:15:44  512  mac. r/r 129 /evidence/payload.exe');
        break;
      case 'vol.py --info':
        term.writeln('[*] Volatility 3 Framework');
        term.writeln('[+] Profile: Win10x64_19041');
        term.writeln('[+] Processes: 87 running | 3 suspicious (cmd.exe, powershell.exe, nc.exe)');
        term.writeln('[!] Network connection: nc.exe -> 185.220.101.47:4444 (ESTABLISHED)');
        term.writeln('[!] Possible reverse shell detected.');
        break;
      case 'clear':
        term.clear();
        break;
      case '':
        break;
      default:
        term.writeln(`bash: ${command}: command not found. Type "help" for available commands.`);
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