const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    // Configuramos el socket para que no mande NINGÚN log
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'fatal' }), // Solo errores fatales, nada de avisos amarillos
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log('✅ CONECTADO')
        if (connection === 'close') start()
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
