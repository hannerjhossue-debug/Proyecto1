const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    jidDecode, 
    proto 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// --- BASES DE DATOS EN MEMORIA ---
global.ausentes = {};    
global.listaNegra = [];  
global.antiSticker = {}; 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    // Eliminamos la opción que causa el bucle de advertencias
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Safari', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    // Manejo de conexión corregido
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Si hay un QR nuevo, lo mostramos manualmente para evitar el error
        if (qr) {
            console.log('✨ ESCANEA EL CÓDIGO QR PARA CONECTAR ✨');
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando...');
                startBot();
            } else {
                console.log('❌ Sesión cerrada. Borra la carpeta auth_info_baileys.');
            }
        } else if (connection === 'open') {
            console.log('🍜 Maruchan Bot Conectado con Éxito');
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            const from = m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = m.key.participant || from;
            
            // Lógica Anti-Sticker
            if (isGroup && global.antiSticker[from] && m.message.stickerMessage) {
                await sock.sendMessage(from, { delete: m.key });
                return;
            }

            // Lógica Ausente (AFK)
            if (global.ausentes[sender]) {
                delete global.ausentes[sender];
                await sock.sendMessage(from, { text: '✅ Ya no estás en modo ausente.' });
            }

            // Procesador de Comandos
            const prefix = '/';
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            if (body.startsWith(prefix)) {
                const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
                const text = body.trim().split(/ +/).slice(1).join(' ');
                const pluginPath = path.join(__dirname, 'plugins', `${command}.js`);
                if (fs.existsSync(pluginPath)) {
                    require(pluginPath).run(sock, m, text);
                }
            }
        } catch (err) {
            console.log(err);
        }
    });
}

startBot();
