module.exports = {
    name: 'ausente',
    alias: ['afk'],
    description: 'Activa el modo de ausencia.',
    run: async (sock, m, texto) => {
        const sender = m.key.participant || m.key.remoteJid;
        global.ausentes[sender] = {
            razon: texto || 'Sin razón',
            hora: Date.now()
        };
        await sock.sendMessage(m.key.remoteJid, { 
            text: `💤 *MODO AUSENTE ACTIVADO*\n\nEstarás fuera por: ${texto || 'Sin razón'}.\n_Si alguien te menciona, yo le avisaré._`,
            mentions: [sender]
        }, { quoted: m });
    }
};
