import {  WASocket } from '@whiskeysockets/baileys';
import axios from 'axios';

async function enviarMensagemWhatsApp(numero: string, mensagem: string, sock: WASocket) {
    try {
        const formattedNumber = '55' + numero + '@s.whatsapp.net';
        console.log(`Enviando mensagem para: ${formattedNumber}`);
        await sock.sendMessage(formattedNumber, { text: mensagem });
        console.log(`Mensagem enviada para: ${formattedNumber}`);
    } catch (error) {
        console.error("Erro ao enviar mensagem via WhatsApp:", error);
    }
}

export async function whatsappTriggerIrrigacao(sock: WASocket) {
    try {
        console.log('Obtendo lista de usuários...');
        const response = await axios.get('https://backend-demeter-xi.vercel.app/usuarios');
        const usuarios = response.data;

        console.log(`Número de usuários obtidos: ${usuarios.length}`);

        for (const usuario of usuarios) {
            console.log(`Processando usuário: ${usuario.nome} (ID: ${usuario.id})`);
            const responseCulturas = await axios.post(`https://backend-demeter-xi.vercel.app/usuario/${usuario.id}/culturas`);
            const culturas = responseCulturas.data;
            let mensagem = `Olá ${usuario.nome}, aqui está o status das suas culturas:\n`;

            for (const cultura of culturas) {
                mensagem += `Cultura: ${cultura.nome}, Falta irrigar: ${cultura.mm_restante} mm/dia.\n`;
            }

            await enviarMensagemWhatsApp(usuario.tel, mensagem, sock);
        }

        console.log("Mensagens enviadas com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar mensagens:", error);
    }
}

/*export const handler = async (event) => {
    await init();
    return {
        statusCode: 200,
        body: JSON.stringify('Mensagens enviadas com sucesso!'),
    };
};
*/