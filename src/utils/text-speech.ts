import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput } from "@aws-sdk/client-polly";
import { WriteStream, createWriteStream } from "fs";

export async function synthesizeSpeech(message: string) {
    // Crie um cliente Polly
    const pollyClient = new PollyClient({ region: "us-east-1" });

    // Configure o comando de síntese de fala
    const params: SynthesizeSpeechCommandInput = {
        Text: message,
        OutputFormat: "ogg_vorbis",
        VoiceId: "Joanna"
    };

    try {
        // Execute o comando
        const command = new SynthesizeSpeechCommand(params);
        const response = await pollyClient.send(command);

        // Verifique se o áudio foi gerado corretamente
        if (response.AudioStream instanceof Buffer) {
            const writeStream: WriteStream = createWriteStream("output.ogg");
            writeStream.write(response.AudioStream);
            writeStream.end();
            console.log("Audio file saved as output.mp3");
        } else {
            console.error("Audio stream is not a buffer.");
        }
    } catch (err) {
        console.error("An error occurred:", err);
    }
}

