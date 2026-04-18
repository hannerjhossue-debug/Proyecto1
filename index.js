const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');

global.ausentes = {};    
global.listaNegra = [];  
global.antiSticker = {}; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('✨ MARUCHAN BOT: ESCANEA EL QR ABAJO ✨');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            
            // Si la sesión se cerró o no existe, NO REINTENTAR AUTOMÁTICAMENTE
            if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Sesión cerrada. Escanea de nuevo.');
            } else {
                console.log('🔄 Reintentando en 5 segundos...');
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log('🍜 CONECTADO CON ÉXITO');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            const from = m.key.remoteJid;
            
            if (from.endsWith('@g.us') && global.antiSticker[from] && m.message.stickerMessage) {
                await sock.sendMessage(from, { delete: m.key });
                return;
            }

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
