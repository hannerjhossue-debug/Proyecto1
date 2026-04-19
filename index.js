const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode-terminal')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        // Quitamos la opción que daba el error amarillo
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        // Si sale el QR, lo dibujamos nosotros a la fuerza
        if (qr) {
            console.log('✨ MARUCHAN BOT: ESCANEA ESTE QR ✨')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => start(), 3000)
            }
        } else if (connection === 'open') {
            console.log('✅ CONECTADO CON ÉXITO')
        }
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0]
        if (!m || !m.message || m.key.fromMe) return
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (body.startsWith('/')) {
            const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
            const text = body.trim().split(/ +/).slice(1).join(' ')
            try {
                require(`./plugins/${cmd}.js`).run(sock, m, text)
            } catch (e) { }
        }
    })
}
start()
