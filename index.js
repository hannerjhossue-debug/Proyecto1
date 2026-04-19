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

// 1. ESTRUCTURA PARA FUNCIONES FUTURAS (AFK, ANTI-STICKER, ETC)
global.ausentes = {};    
global.antiSticker = {}; 
global.listaNegra = [];  

async function startBot() {
    // 2. GESTIÓN DE SESIÓN
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    // 3. CONTROL DE CONEXIÓN Y QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('✨ MARUCHAN BOT: ESCANEA EL QR ✨');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`🔄 Conexión cerrada (Razón: ${reason}). Reintentando...`);
            
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(), 5000);
            } else {
                console.log('❌ Sesión cerrada. Borra la carpeta auth_info_baileys y escanea de nuevo.');
            }
        } else if (connection === 'open') {
            console.log('🍜 MARUCHAN BOT: ONLINE Y LISTO');
        }
    });

    // 4. LÓGICA DE MENSAJES Y COMANDOS
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m || !m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
            const isCmd = body.startsWith('/');

            // Logs para depuración (ver qué lee el bot)
            console.log(`📩 [${from}] dice: ${body}`);

            if (isCmd) {
                const command = body.slice(1).trim().split(' ')[0].toLowerCase();
                const text = body.trim().split(/ +/).slice(1).join(' ');
                
                // Ruta dinámica de plugins
                const pluginPath = path.join(__dirname, 'plugins', `${command}.js`);

                if (fs.existsSync(pluginPath)) {
                    console.log(`🔍 Ejecutando comando: /${command}`);
                    try {
                        const plugin = require(pluginPath);
                        await plugin.run(sock, m, text);
                    } catch (err) {
                        console.error(`❌ Error en plugin ${command}:`, err);
                    }
                } else {
                    console.log(`⚠️ No existe el archivo: ${pluginPath}`);
                }
            }

            // Aquí es donde meteremos la lógica de "Muteo" o "AFK" después
            // Por ahora, solo dejamos el espacio listo para no romper el código.

        } catch (err) {
            console.error('❌ Error en el manejador de mensajes:', err);
        }
    });
}

// 5. ARRANCAR
startBot().catch(err => console.error('Error fatal al iniciar:', err));
