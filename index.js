const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')
const pino = require('pino')
const fs = require('fs')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update
        if (qr) qrcode.generate(qr, { small: true })
        if (connection === 'open') console.log('✅ MARUCHAN ONLINE')
        if (connection === 'close') start()
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0]
        if (!m || !m.message || m.key.fromMe) return
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (body.startsWith('/')) {
            const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
            const text = body.trim().split(/ +/).slice(1).join(' ')
            if (fs.existsSync(`./plugins/${cmd}.js`)) {
                require(`./plugins/${cmd}.js`).run(sock, m, text)
            }
        }
    })
}
start()
