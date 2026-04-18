const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    run: async (sock, m, texto) => {
        const from = m.key.remoteJid;
        const type = Object.keys(m.message)[0];
        const quoted = type === 'extendedTextMessage' ? m.message.extendedTextMessage.contextInfo.quotedMessage : null;
        const finalType = quoted ? Object.keys(quoted)[0] : type;

        if (finalType === 'imageMessage') {
            const msg = quoted ? quoted.imageMessage : m.message.imageMessage;
            const stream = await downloadContentFromMessage(msg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            const fileName = `./${Date.now()}.webp`;
            fs.writeFileSync('./tmp.jpg', buffer);
            
            // Comando para convertir a webp (formato de sticker)
            exec(`ffmpeg -i ./tmp.jpg -vcodec libwebp -filter:v "scale='if(gt(a,1),512,-1)':'if(gt(a,1),-1,512)',pad=512:512:(512-iw)/2:(512-ih)/2:color=white@0" -lossless 1 ${fileName}`, async (err) => {
                if (err) return sock.sendMessage(from, { text: '❌ Error al crear sticker' });
                
                await sock.sendMessage(from, { sticker: fs.readFileSync(fileName) }, { quoted: m });
                fs.unlinkSync('./tmp.jpg');
                fs.unlinkSync(fileName);
            });
        } else {
            await sock.sendMessage(from, { text: 'Responde a una imagen con */s* o envía una con el comando en el texto.' });
        }
    }
};
