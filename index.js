const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path'); // Usaremos esto para rutas exactas
const qrcode = require('qrcode-terminal');

global.ausentes = {};    
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
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log('🍜 MARUCHAN BOT: ONLINE Y LISTO');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            
            if (body.startsWith('/')) {
                const command = body.slice(1).trim().split(' ')[0].toLowerCase();
                const text = body.trim().split(/ +/).slice(1).join(' ');
                
                // BUSQUEDA MEJORADA DE ARCHIVOS
                const directoryPath = path.join(__dirname, 'plugins');
                const pathFile = path.join(directoryPath, `${command}.js`);

                if (fs.existsSync(pathFile)) {
                    console.log(`✅ Ejecutando comando: ${command}`);
                    delete require.cache[require.resolve(pathFile)];
                    const plugin = require(pathFile);
                    await plugin.run(sock, m, text);
                } else {
                    console.log(`⚠️ No se encontró el archivo físico en: ${pathFile}`);
                    // Esto te confirmará en WhatsApp que el bot te escucha pero no halla el archivo
                    await sock.sendMessage(from, { text: `❌ No encuentro el archivo para el comando: /${command}` });
                }
            }
        } catch (err) {
            console.error('❌ Error crítico:', err);
        }
    });
}

startBot();
