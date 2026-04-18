const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    disconnectReason, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    jidDecode, 
    proto 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const path = require('path');

// --- BASES DE DATOS SIMPLES EN MEMORIA ---
global.ausentes = {};    // Para el sistema AFK
global.listaNegra = [];  // Para usuarios muteados
global.antiSticker = {}; // Para el control de grupos (se guarda por ID de grupo)

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
            if (!m.message) return;
            const from = m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const sender = m.key.participant || from;
            const pushName = m.pushName || 'Usuario';
            
            // 1. LÓGICA DE LISTA NEGRA (MUTE)
            if (global.listaNegra.includes(sender)) return;

            // 2. LÓGICA DE ANTI-STICKER
            if (isGroup && global.antiSticker[from]) {
                if (m.message.stickerMessage) {
                    await sock.sendMessage(from, { delete: m.key });
                    return; // No procesar nada más si era un sticker prohibido
                }
            }

            // 3. LÓGICA DE AUSENCIA (AFK)
            // Si mencionan a alguien que está ausente
            const mensiones = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            mensiones.forEach(jid => {
                if (global.ausentes[jid]) {
                    const data = global.ausentes[jid];
                    const tiempo = Math.floor((Date.now() - data.hora) / 1000);
                    sock.sendMessage(from, { 
                        text: `🍜 *Maruchan Avisa:* @${jid.split('@')[0]} está ausente.\n\n📝 *Razón:* ${data.razon}\n⏳ *Tiempo:* ${tiempo} segundos.`,
                        mentions: [jid]
                    }, { quoted: m });
                }
            });

            // Si el usuario ausente regresa
            if (global.ausentes[sender]) {
                const tiempoFuera = Math.floor((Date.now() - global.ausentes[sender].hora) / 1000);
                await sock.sendMessage(from, { text: `✅ ¡Bienvenido de nuevo ${pushName}! Estuviste fuera ${tiempoFuera} segundos.` });
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
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== disconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('🍜 Maruchan Bot Conectado con Éxito');
        }
    });
}

startBot();
