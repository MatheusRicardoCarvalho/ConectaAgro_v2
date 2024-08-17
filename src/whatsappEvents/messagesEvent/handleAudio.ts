import { proto, WASocket, downloadContentFromMessage } from "@whiskeysockets/baileys";
import axios from 'axios';
import { MessageUpsert } from "./handleUpsert";
import FormData from "form-data";
import * as dotenv from "dotenv";
import { Transform } from "stream";
dotenv.config();

export async function handleAudioMessage(m: MessageUpsert, sock: WASocket): Promise<string> {
    const message = m.messages[0];
    const audioMessage = message.message?.audioMessage!;
    const audioUrl = audioMessage.url!;
    const mediaKey = audioMessage.mediaKey!;
    const directPath = audioMessage.directPath!;
    console.log("URL do audio: \n" + audioUrl);

    try {
            // Faz o download do áudio como um stream
    const audioStream = await downloadContentFromMessage({ mediaKey, directPath, url: audioUrl }, "audio");

    const transcription = await transcribeAudio(audioStream);
    return transcription;

    } catch(error) {
        if(error instanceof Error) throw new Error ("Erro no processamento do áudio: "+error.message)
        else throw new Error ("Erro no processamento do áudio")
    }


}

async function transcribeAudio(audioStream: Transform): Promise<string> {
    const form = new FormData();
    form.append('file', audioStream, {
        contentType: 'audio/ogg', // Ajuste o tipo MIME conforme necessário
        filename: 'audio.ogg'      // Nome fictício do arquivo
    });
    form.append('model', 'whisper-1');

    try {
        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                ...form.getHeaders()
            }
        });
        console.log('Transcrição:', response.data.text);
        return '' + response.data.text;
    } catch (error) {
        console.error('Erro ao transcrever o áudio:', error);
        throw new Error ("Erro na transcrição de áudio"+error)
    }
}
