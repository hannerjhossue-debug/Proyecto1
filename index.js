const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const fs = require('fs')

async function startBot() {
    // 1. Gestión de sesión limpia
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    // 2. Evento de conexión y QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('✨ MARUCHAN-BOT: ESCANEA EL QR ABAJO')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            if (code !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando...')
                startBot()
            }
        } else if (connection === 'open') {
            console.log('🍜 BOT ONLINE: ¡LISTO PARA TRABAJAR!')
        }
    })

    // 3. Escucha de comandos (Sencillo y sin errores)
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0]
        if (!m || !m.message || m.key.fromMe) return
        
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        
        if (body.startsWith('/')) {
            const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
            const text = body.trim().split(/ +/).slice(1).join(' ')
            const file = `./plugins/${cmd}.js`
            
            if (fs.existsSync(file)) {
                try {
                    delete require.cache[require.resolve(file)]
                    require(file).run(sock, m, text)
                } catch (e) {
                    console.error(`❌ Error en comando /${cmd}`)
                }
            }
        }
    })
}

startBot().catch(err => console.log("Error:", err))
