module.exports = {
    name: 'afk',
    alias: ['ocupado', 'brb'],
    category: 'principal',
    description: 'Establece un estado de ausencia.',
    run: async (sock, m, texto) => {
        const user = m.key.participant || m.key.remoteJid;
        const razon = texto || 'Sin razón especificada';
        
        global.afk[user] = {
            reason: razon,
            time: Date.now()
        };

        const msg = `💤 *MODO AFK ACTIVADO*\n\n👤 *Usuario:* @${user.split('@')[0]}\n📝 *Razón:* ${razon}\n\n_El bot avisará a quien te mencione._`;
        
        await sock.sendMessage(m.key.remoteJid, { 
            text: msg, 
            mentions: [user] 
        }, { quoted: m });
    }
};
