const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// BASES DE DATOS
global.ausentes = {};    
global.listaNegra = [];  
global.antiSticker = {}; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Configuramos la conexión de forma limpia
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Si la librería manda un QR, lo imprimimos nosotros mismos
        if (qr) {
            console.log('-------------------------------------------');
            console.log('✨ ESCANEA EL QR CON TU WHATSAPP ✨');
            console.log('-------------------------------------------');
            require('qrcode-terminal').generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reintentando conexión...');
                startBot();
            } else {
                console.log('❌ Sesión cerrada.');
            }
        } else if (connection === 'open') {
            console.log('🍜 MARUCHAN BOT: CONECTADO');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            const from = m.key.remoteJid;
            
            // ANTI-STICKER
            if (from.endsWith('@g.us') && global.antiSticker[from] && m.message.stickerMessage) {
                await sock.sendMessage(from, { delete: m.key });
                return;
            }

            // COMANDOS
            const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
            if (body.startsWith('/')) {
                const command = body.slice(1).trim().split(' ')[0].toLowerCase();
                const text = body.trim().split(/ +/).slice(1).join(' ');
                const pluginPath = path.join(__dirname, 'plugins', `${command}.js`);
                if (fs.existsSync(pluginPath)) {
                    require(pluginPath).run(sock, m, text);
                }
            }
        } catch (err) { console.log(err) }
    });
}

startBot();
