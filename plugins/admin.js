module.exports = {
    name: 'admin',
    description: 'Comandos de administración.',
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const comando = texto.split(' ')[0];
        
        if (comando === 'antisticker') {
            global.antiSticker[from] = !global.antiSticker[from];
            return sock.sendMessage(from, { text: `🚫 Anti-Stickers: *${global.antiSticker[from] ? 'ACTIVADO' : 'DESACTIVADO'}*` });
        }

        if (comando === 'mute') {
            const mencionado = m.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
            if (!mencionado) return sock.sendMessage(from, { text: '🍜 _Etiqueta a alguien para mutearlo._' });
            global.listaNegra.push(mencionado);
            return sock.sendMessage(from, { text: `🤐 Usuario muteado. El bot ahora lo ignorará.` });
        }
    }
};
