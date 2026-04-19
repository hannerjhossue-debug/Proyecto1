const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

global.ausentes = {};    

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
        // Quitamos la línea de printQRInTerminal que daba el aviso amarillo
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Esta es la forma correcta de mostrar el QR ahora:
        if (qr) {
            console.log('✨ ESCANEA EL QR ABAJO:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🍜 MARUCHAN BOT: ONLINE');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m || !m.message || m.key.fromMe) return;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (body.startsWith('/')) {
            const command = body.slice(1).trim().split(' ')[0].toLowerCase();
            const text = body.trim().split(/ +/).slice(1).join(' ');
            const path = `./plugins/${command}.js`;

            if (fs.existsSync(path)) {
                try {
                    delete require.cache[require.resolve(path)];
                    const plugin = require(path);
                    await plugin.run(sock, m, text);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });
}

startBot();
