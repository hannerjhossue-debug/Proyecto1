const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

// BASES PARA TUS COMANDOS
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
                
                // ESTA ES LA RUTA MÁS SENCILLA POSIBLE
                const pathFile = `./plugins/${command}.js`;

                if (fs.existsSync(pathFile)) {
                    console.log(`✅ Ejecutando: ${pathFile}`);
                    // Eliminamos el caché para que si editas el plugin se actualice solo
                    delete require.cache[require.resolve(pathFile)];
                    const plugin = require(pathFile);
                    await plugin.run(sock, m, text);
                } else {
                    console.log(`⚠️ No se encontró: ${pathFile}`);
                    // Opcional: avisar al usuario
                    // await sock.sendMessage(from, { text: 'Ese comando no existe.' });
                }
            }
        } catch (err) {
            console.error('❌ Error ejecutando comando:', err);
        }
    });
}

startBot();
