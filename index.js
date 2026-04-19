const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

// BASES PARA FUNCIONES (AFK, ETC)
global.ausentes = {};    

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0'],
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('🍜 MARUCHAN BOT: CONECTADO Y SINCRONIZANDO');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        if (!m || !m.message || m.key.fromMe) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        
        if (body.startsWith('/')) {
            const command = body.slice(1).trim().split(' ')[0].toLowerCase();
            const text = body.trim().split(/ +/).slice(1).join(' ');
            
            // Ruta ultra-simple
            const path = `./plugins/${command}.js`;

            if (fs.existsSync(path)) {
                try {
                    delete require.cache[require.resolve(path)];
                    const plugin = require(path);
                    await plugin.run(sock, m, text);
                    console.log(`✅ Ejecutado: /${command}`);
                } catch (e) {
                    console.error(`❌ Error en /${command}:`, e);
                }
            } else {
                console.log(`⚠️ No existe el archivo: ${path}`);
            }
        }
    });
}

startBot();
