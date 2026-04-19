const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')

async function start() {
    // Aquí cargará la sesión que acabas de activar con el QR
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Maruchan-Bot', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log('🍜 MARUCHAN BOT: ONLINE Y LISTO')
        if (connection === 'close') start()
    })

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages[0]
        if (!m || !m.message || m.key.fromMe) return
        
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        
        if (body.startsWith('/')) {
            const cmd = body.slice(1).trim().split(' ')[0].toLowerCase()
            const text = body.trim().split(/ +/).slice(1).join(' ')
            
            // Esto es lo que hace que tus comandos funcionen
            const path = `./plugins/${cmd}.js`
            if (fs.existsSync(path)) {
                try {
                    require(path).run(sock, m, text)
                } catch (e) {
                    console.log(`Error en comando ${cmd}:`, e)
                }
            }
        }
    })
}
start()
