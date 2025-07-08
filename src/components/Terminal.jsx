import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import '../styles/Terminal.css';

function TerminalComponent() {
    const terminalRef = useRef(null);
    const xterm = useRef(null);
    const fitAddon = useRef(null);
    const inputBuffer = useRef('');

    useEffect(() => {
        const initTerminal = () => {
            if (!terminalRef.current || xterm.current) return;

            // Init xterm and fit
            xterm.current = new Terminal({
                cursorBlink: true,
                fontFamily: 'monospace',
                fontSize: 14,
                theme: {
                    background: '#1e1e1e',
                    foreground: '#ffffff',
                },
                scrollback: 1000,
            });

            fitAddon.current = new FitAddon();
            xterm.current.loadAddon(fitAddon.current);
            xterm.current.open(terminalRef.current);
            fitAddon.current.fit();

            // Focus to allow typing
            xterm.current.focus();

            xterm.current.writeln('Welcome to the terminal!');
            xterm.current.write('>');

            xterm.current.onData(data => {
                const char = data.charCodeAt(0);

                if (char === 13) {
                    // ENTER
                    xterm.current.write('\r\n>');
                    inputBuffer.current = '';
                } else if (char === 127) {
                    // BACKSPACE
                    if (inputBuffer.current.length > 0) {
                        inputBuffer.current = inputBuffer.current.slice(0, -1);
                        xterm.current.write('\b \b');
                    }
                } else {
                    inputBuffer.current += data;
                    xterm.current.write(data);
                }
            });

            // Refit on resize
            const handleResize = () => fitAddon.current?.fit();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                xterm.current?.dispose();
                fitAddon.current = null;
                xterm.current = null;
            };
        };

        setTimeout(initTerminal, 0); // Ensure DOM has rendered before mounting

    }, []);

    return <div ref={terminalRef} className="terminal-container" />;
}

export default TerminalComponent;
