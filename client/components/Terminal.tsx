"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { useTheme } from "next-themes";

function ForensicTerminalContent({ isDark }: { isDark: boolean }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);

  const handleCommand = (cmd: string, term: Terminal) => {
    const command = cmd.trim().toLowerCase();

    switch (command) {
      case "help":
        term.writeln(
          "Commands: autopsy, wireshark --cli, fls <image>, mactime, vol.py --info, hash <file>, clear"
        );
        break;

      case "autopsy":
        term.writeln("[*] Initializing Sleuth Kit engine...");
        term.writeln("[*] Mounting /dev/sda1 as read-only...");
        term.writeln("[+] Partition table: MBR | 3 partitions found");
        term.writeln("[+] File system: NTFS (offset 2048)");
        term.writeln("[!] 4 deleted files recoverable in $Recycle.Bin");
        term.writeln("[+] Scan complete. Open Autopsy GUI for full report.");
        break;

      case "wireshark --cli":
        term.writeln("[*] Capturing on eth0 (promiscuous mode)...");
        term.writeln("  Frame 1: 192.168.1.5 -> 8.8.8.8 DNS Query: forensics.gov");
        term.writeln("  Frame 2: 8.8.8.8 -> 192.168.1.5 DNS Response: 142.250.80.46");
        term.writeln("  Frame 3: 192.168.1.5 -> 142.250.80.46 TCP SYN");
        term.writeln("[!] Suspicious outbound connection on port 4444 detected.");
        break;

      case "fls":
      case "fls <image>":
        term.writeln("r/r 5:    $MFT");
        term.writeln("r/r 6:    $MFTMirr");
        term.writeln("d/d 11:   $Orphan");
        term.writeln("r/r 128:  evidence.dd");
        term.writeln("r/r 129:  suspect_chat_logs.txt (deleted)");
        term.writeln("r/r 130:  payload.exe (deleted)");
        break;

      case "mactime":
        term.writeln("Mon Jan 13 2025 09:14:22 4096 m... d/d 11 /evidence");
        term.writeln("Mon Jan 13 2025 09:15:01 2048 .a.. r/r 128 /evidence/suspect_chat_logs.txt");
        term.writeln("Mon Jan 13 2025 09:15:44 512 mac. r/r 129 /evidence/payload.exe");
        break;

      case "vol.py --info":
        term.writeln("[*] Volatility 3 Framework");
        term.writeln("[+] Profile: Win10x64_19041");
        term.writeln("[+] Processes: 87 running | 3 suspicious (cmd.exe, powershell.exe, nc.exe)");
        term.writeln("[!] Network connection: nc.exe -> 185.220.101.47:4444 (ESTABLISHED)");
        term.writeln("[!] Possible reverse shell detected.");
        break;

      case "clear":
        term.clear();
        break;

      case "hash":
      case "hash <file>":
        term.writeln("[*] Computing forensic hashes for evidence file...");
        term.writeln("[+] SHA-256: a81f3c72b9e4d6f1c0a5827e3d49b610f7e2c8a5d3b94f16e0c7d2a8b5e3f194");
        term.writeln("[+] MD5:     7f8a3b2c1d0e9f4a5b6c7d8e9f0a1b2c");
        term.writeln("[+] SHA-1:   3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d");
        term.writeln("[+] Integrity: VERIFIED - No tampering detected.");
        break;

      case "":
        break;

      default:
        term.writeln(`bash: ${command}: command not found. Type "help" for available commands.`);
    }
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (!terminalRef.current || initialized.current) return;
    initialized.current = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      rows: 20,
      cols: 80,
      theme: {
        background: isDark ? "#0f172a" : "#ffffff",
        foreground: isDark ? "#e2e8f0" : "#0f172a",
        cursor: isDark ? "#e2e8f0" : "#0f172a",
        selectionBackground: isDark ? "rgba(226, 232, 240, 0.2)" : "rgba(15, 23, 42, 0.1)",
      },
      fontSize: 14,
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    termInstance.current = term;

    let initTimeout: NodeJS.Timeout;
    const checkInterval = setInterval(() => {
      if (terminalRef.current && terminalRef.current.offsetWidth > 0 && initialized.current === false) {
        clearInterval(checkInterval);
        
        try {
          term.open(terminalRef.current);
          
          initTimeout = setTimeout(() => {
            if (termInstance.current && terminalRef.current && terminalRef.current.offsetParent) {
              try {
                fitAddon.fit();
                termInstance.current.focus();
                termInstance.current.writeln("\x1b[1;32m--- FORENSIC_PRO_TERMINAL v1.0.4 ---\x1b[0m");
                termInstance.current.writeln('Type "help" to see available forensic commands.');
                termInstance.current.write("\r\n$ ");
              } catch {
                // Ignore fit errors
              }
            }
          }, 100);
        } catch {
          // Fallback if open fails
        }
      }
    }, 50);

    const resizeObserver = new ResizeObserver(() => {
      if (!termInstance.current || !terminalRef.current || !terminalRef.current.offsetParent) return;
      try {
        fitAddon.fit();
        } catch {
          // Ignore dispose errors
        }
    });
    resizeObserver.observe(terminalRef.current);

    let currentLine = "";
    const keyDisposable = term.onKey(({ key, domEvent }) => {
      if (!termInstance.current || !terminalRef.current || !terminalRef.current.offsetParent) return;
      const char = key;
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) { // Enter
        term.write("\r\n");
        handleCommand(currentLine, term);
        currentLine = "";
        term.write("$ ");
      } else if (domEvent.keyCode === 8) { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write("\b \b");
        }
      } else if (printable && char.length === 1) {
        currentLine += char;
        term.write(char);
      }
    });

    return () => {
      clearInterval(checkInterval);
      if (initTimeout) clearTimeout(initTimeout);
      keyDisposable.dispose();
      resizeObserver.disconnect();
      
      const toDispose = termInstance.current;
      termInstance.current = null;
      initialized.current = false;
      
      if (toDispose) {
        try {
          toDispose.dispose();
        } catch {
          // Ignore dispose errors
        }
      }
    };
  }, [isDark]);

  useEffect(() => {
    if (termInstance.current) {
      termInstance.current.options.theme = {
        background: isDark ? "#0f172a" : "#ffffff",
        foreground: isDark ? "#e2e8f0" : "#0f172a",
        cursor: isDark ? "#e2e8f0" : "#0f172a",
        selectionBackground: isDark ? "rgba(226, 232, 240, 0.2)" : "rgba(15, 23, 42, 0.1)",
      };
    }
  }, [isDark]);

  return (
    <div 
      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mt-8 shadow-sm cursor-text"
      onClick={() => {
        if (termInstance.current) {
          termInstance.current.focus();
        }
      }}
    >
      <div className="flex items-center gap-2 mb-3 px-2 border-b border-slate-100 dark:border-slate-800/50 pb-2">
        <div className="h-3 w-3 rounded-full bg-red-500/80 shadow-sm shadow-red-500/20"></div>
        <div className="h-3 w-3 rounded-full bg-amber-500/80 shadow-sm shadow-amber-500/20"></div>
        <div className="h-3 w-3 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/20"></div>
        <span className="text-[10px] text-emerald-500 font-mono ml-4 uppercase tracking-[0.2em] font-bold">
          TERMINAL_ACTIVE
        </span>
      </div>

      <div 
        ref={terminalRef} 
        className={`h-64 rounded-lg overflow-hidden transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-white"}`} 
      />
    </div>
  );
}

export default function ForensicTerminal() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return <div className="h-64 mt-8 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />;
  }

  return <ForensicTerminalContent isDark={isDark} />;
}