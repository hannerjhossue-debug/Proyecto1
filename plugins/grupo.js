module.exports = {
    name: 'grupo',
    alias: ['group', 'cerrar', 'abrir'],
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return m.reply('❌ Este comando solo sirve en grupos.');

        // Solo el dueño o admins deberían usar esto (por ahora lo dejamos libre para que pruebes)
        if (texto === 'cerrar') {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 *Grupo Cerrado.* Solo los administradores pueden enviar mensajes.' });
        } else if (texto === 'abrir') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: '🔓 *Grupo Abierto.* Todos pueden hablar.' });
        } else {
            await sock.sendMessage(from, { text: 'Uso: */grupo cerrar* o */grupo abrir*' });
        }
    }
};
