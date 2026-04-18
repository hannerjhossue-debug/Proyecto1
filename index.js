const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const conectarDB = require('./database');

async function iniciarBot() {
    await conectarDB();

    const { state, saveCreds } = await useMultiFileAuthState('auth_maruchan');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Maruchan Bot', 'Safari', '3.0']
    });

    sock.ev.on('creds.update', saveCreds);

    // --- CARGADOR DE PLUGINS ---
    const plugins = {};
    const cargarPlugins = () => {
        if (!fs.existsSync('./plugins')) fs.mkdirSync('./plugins');
        const archivos = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));
        for (const file of archivos) {
            delete require.cache[require.resolve(`./plugins/${file}`)];
            const command = require(`./plugins/${file}`);
            plugins[command.name] = command;
        }
        console.log(`✅ [SISTEMA] ${archivos.length} Plugins cargados`);
    };
    cargarPlugins();

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) qrcode.generate(qr, { small: true });
        if (connection === 'close') {
            const razon = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (razon !== DisconnectReason.loggedOut) iniciarBot();
        } else if (connection === 'open') {
            console.log('✅ [CONECTADO] Maruchan Bot listo');
        }
    });

    sock.ev.on('messages.upsert', async chatUpdate => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
            const prefix = '/'; 
            
            if (!body.startsWith(prefix)) return;

            const comandoNombre = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
            const args = body.trim().split(/ +/).slice(1);
            const texto = args.join(' ');

            // --- LOGS EN CONSOLA (CORREGIDO) ---
            console.log(`🚀 [COMANDO] ${comandoNombre} | De: ${m.pushName || 'Usuario'} | En: ${from}`);

            const plugin = Object.values(plugins).find(p => 
                p.name === comandoNombre || (p.alias && p.alias.includes(comandoNombre))
            );
            
            if (plugin) {
                await plugin.run(sock, m, texto);
            }
        } catch (err) {
            console.log('❌ Error:', err);
        }
    });
}

iniciarBot();
