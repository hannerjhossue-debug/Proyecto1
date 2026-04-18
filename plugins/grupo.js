module.exports = {
    name: 'grupo',
    alias: ['group'],
    description: 'Administra el estado del grupo.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return sock.sendMessage(from, { text: '🍜 _Solo en grupos._' });

        if (texto === 'cerrar') {
            await sock.groupSettingUpdate(from, 'announcement');
            await sock.sendMessage(from, { text: '🔒 *Grupo Cerrado*' });
        } else if (texto === 'abrir') {
            await sock.groupSettingUpdate(from, 'not_announcement');
            await sock.sendMessage(from, { text: '🔓 *Grupo Abierto*' });
        } else {
            await sock.sendMessage(from, { text: '🍜 _Uso: /grupo abrir o cerrar_' });
        }
    }
};
