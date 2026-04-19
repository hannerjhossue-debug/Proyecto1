const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const { Boom } = require('@hapi/boom')

async function start() {
    console.log('⏳ Iniciando sistema Maruchan...')
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
            console.log('✅ ESCANEA EL QR AQUÍ ABAJO:')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            console.log('🔄 Conexión cerrada. Razón:', reason)
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log('⚠️ Reintentando en 5 segundos para no saturar...')
                setTimeout(() => start(), 5000)
            } else {
                console.log('❌ Sesión cerrada permanentemente. Borra auth_info_baileys.')
            }
        } else if (connection === 'open') {
            console.log('🍜 ¡ESTAMOS ONLINE!')
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0]
            if (!m.message || m.key.fromMe) return
            const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
            if (body.startsWith('/')) {
                const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
                const text = body.trim().split(/ +/).slice(1).join(' ')
                require(`./plugins/${cmd}.js`).run(sock, m, text)
            }
        } catch (e) {
            // No ponemos console.log aquí para que no ensucie la pantalla si el comando no existe
        }
    })
}

start()
