const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const fs = require('fs')
const { Boom } = require('@hapi/boom')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('✨ ESCANEA EL QR AHORA:')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const shouldReconnect = (new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut)
            console.log('🔄 Conexión cerrada, reintentando:', shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('✅ BOT CONECTADO CON ÉXITO')
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0]
        if (!m || !m.message || m.key.fromMe) return
        
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        
        if (body.startsWith('/')) {
            const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
            const text = body.trim().split(/ +/).slice(1).join(' ')
            const pathFile = `./plugins/${cmd}.js`
            
            if (fs.existsSync(pathFile)) {
                try {
                    // Limpia caché para que los cambios en plugins se vean al instante
                    delete require.cache[require.resolve(pathFile)]
                    const plugin = require(pathFile)
                    await plugin.run(sock, m, text)
                } catch (e) {
                    console.error(`❌ Error en comando /${cmd}:`, e)
                }
            } else {
                console.log(`⚠️ Comando no encontrado: ${pathFile}`)
            }
        }
    })
}

startBot().catch(err => console.error("Error fatal:", err))
