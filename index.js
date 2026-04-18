const { default: makeWASocket, useMultiFileAuthState, disconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const conectarDB = require('./database');

async function iniciarBot() {
    await conectarDB(); // Inicia la base de datos primero

    const { state, saveCreds } = await useMultiFileAuthState('auth_maruchan');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['Maruchan Bot', 'Safari', '3.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let razon = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(`Conexión cerrada. Razón: ${razon}. Reconectando...`);
            iniciarBot();
        } else if (connection === 'open') {
            console.log('✅ [SISTEMA] Bot conectado con éxito a WhatsApp');
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Si la librería manda un QR, esto lo imprime en la consola
        if (qr) {
            console.log("Sigue estos pasos:\n1. Abre WhatsApp\n2. Dispositivos vinculados\n3. Escanea el código de abajo:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada, reconectando...', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        } else if (connection === 'open') {
            console.log('✅ [SISTEMA] Bot conectado con éxito');
        }
    });
            // --- SECCIÓN DE COMANDOS ---
            if (comando === 'hola') {
                await sock.sendMessage(from, { text: '¡Hola! Soy tu bot Maruchan. 🍜' });
            }

            if (comando === '!ping') {
                await sock.sendMessage(from, { text: '¡Pong! 🏓 El bot está activo.' });
            }
            
            // Aquí puedes ir agregando más comandos tú mismo
        } catch (err) {
            console.error(err);
        }
    });
}

iniciarBot();
