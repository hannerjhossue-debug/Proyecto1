module.exports = {
    name: 'grupo',
    alias: ['group', 'cerrar', 'abrir'],
    category: 'admin',
    description: 'Controla el grupo (abrir o cerrar el chat).',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (!isGroup) return sock.sendMessage(from, { text: '❌ Este comando solo se puede usar en grupos.' }, { quoted: m });

        // Por ahora está libre, luego le pondremos seguridad para que solo tú o los admins lo usen
        if (texto === 'cerrar') {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 *Grupo Cerrado.*\nAhora solo los administradores pueden enviar mensajes.' }, { quoted: m });
        } else if (texto === 'abrir') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: '🔓 *Grupo Abierto.*\nTodos los participantes pueden enviar mensajes.' }, { quoted: m });
        } else {
            await sock.sendMessage(from, { text: '💡 *Modo de uso:*\n/grupo cerrar\n/grupo abrir' }, { quoted: m });
        }
    }
};
