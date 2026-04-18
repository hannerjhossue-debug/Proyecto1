const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const conectarDB = require('./database');

async function iniciarBot() {
    // 1. Conectar a la base de datos
    await conectarDB();

    // 2. Configurar autenticación y versión
    const { state, saveCreds } = await useMultiFileAuthState('auth_maruchan');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false, // Lo manejamos manualmente abajo para evitar errores
        browser: ['Maruchan Bot', 'Safari', '3.0']
    });

    // Guardar credenciales
    sock.ev.on('creds.update', saveCreds);

    // 3. Manejar conexión y QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('✨ ESCANEA EL CÓDIGO QR PARA INICIAR:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const razon = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(`❌ Conexión cerrada. Razón: ${razon}. Reconectando...`);
            if (razon !== DisconnectReason.loggedOut) {
                iniciarBot();
            }
        } else if (connection === 'open') {
            console.log('✅ [SISTEMA] Maruchan Bot conectado con éxito');
        }
    });

    // 4. Escuchar mensajes
    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
            const comando = body.trim().toLowerCase();

            if (comando === 'hola') {
                await sock.sendMessage(from, { text: '¡Hola! Soy Maruchan Bot. 🍜\n\nPrueba con: !ping' });
            }

            if (comando === '!ping') {
                await sock.sendMessage(from, { text: '🏓 ¡Pong! Tu bot está funcionando perfectamente.' });
            }
        } catch (err) {
            console.log('Error procesando mensaje: ', err);
        }
    });
}

// Arrancar el bot
iniciarBot();
