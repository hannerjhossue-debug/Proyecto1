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
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;
            const from = m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = m.key.participant || from;
            const pushName = m.pushName || 'Usuario';
            
            // 1. LISTA NEGRA
            if (global.listaNegra.includes(sender)) return;

            // 2. ANTI-STICKER
            if (isGroup && global.antiSticker[from]) {
                if (m.message.stickerMessage) {
                    await sock.sendMessage(from, { delete: m.key });
                    return;
                }
            }

            // 3. SISTEMA DE AUSENCIA (AFK)
            const menciones = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            menciones.forEach(jid => {
                if (global.ausentes[jid]) {
                    const data = global.ausentes[jid];
                    const tiempo = Math.floor((Date.now() - data.hora) / 1000);
                    sock.sendMessage(from, { 
                        text: `🍜 *Maruchan Avisa:* @${jid.split('@')[0]} está ausente.\n\n📝 *Razón:* ${data.razon}\n⏳ *Tiempo:* ${tiempo} segundos.`,
                        mentions: [jid]
                    }, { quoted: m });
                }
            });

            if (global.ausentes[sender]) {
                const tiempoFuera = Math.floor((Date.now() - global.ausentes[sender].hora) / 1000);
                await sock.sendMessage(from, { text: `✅ ¡Bienvenido de nuevo ${pushName}! Estuviste ausente ${tiempoFuera} segundos.` });
                delete global.ausentes[sender];
            }

            // --- PROCESADOR DE COMANDOS ---
            const prefix = '/';
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            const isCmd = body.startsWith(prefix);
            const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(' ');

            if (isCmd) {
                const pluginPath = path.join(__dirname, 'plugins', `${command}.js`);
                if (fs.existsSync(pluginPath)) {
                    const plugin = require(pluginPath);
                    await plugin.run(sock, m, text);
                }
            }

        } catch (err) {
            console.log('Error procesando mensaje:', err);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            // AQUÍ ESTÁ EL ARREGLO PARA EL ERROR 404/LOGGEDOUT
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log('❌ Sesión cerrada. Borra la carpeta auth_info_baileys y escanea de nuevo.');
            }
        } else if (connection === 'open') {
            console.log('🍜 Maruchan Bot Conectado');
        }
    });
}

startBot();
