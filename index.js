const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')

async function start() {
    console.log('⏳ Iniciando sistema... (Si no sale el QR en 10 seg, avísame)')
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update
        if (qr) {
            console.log('✅ QR GENERADO:')
            qrcode.generate(qr, { small: true })
        }
        if (connection === 'open') console.log('🍜 BOT ONLINE')
        if (connection === 'close') start()
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0]
            if (!m.message || m.key.fromMe) return
            const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
            if (body.startsWith('/')) {
                const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
                require(`./plugins/${cmd}.js`).run(sock, m, body.slice(cmd.length + 2))
            }
        } catch (e) {}
    })
}

start().catch(err => console.log('❌ Error al arrancar:', err))
