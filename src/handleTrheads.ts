import fs from 'fs'
import path from 'path';

import { createThread } from './lib/openai';
import { isInstanceOfThread } from '.';
import { error } from 'console';

export async function addNewThread(numero: string) {
  createThreadsFileIfNotExists()

  try {
    const thread = await createThread();
    const threadsData = JSON.parse(fs.readFileSync('src/threads.json', 'utf8'));
    console.log("Thread criada: "+ JSON.stringify(thread))
    if (isInstanceOfThread(thread)) {
      console.log("TUDO NOS CONFORMES ESTAMOS PRA JOGO")
        threadsData[numero] = thread.id;
        fs.writeFileSync('src/threads.json', JSON.stringify(threadsData, null, 2));
        return thread;
    } else {
        throw new Error('Erro ao adicionar a thread: a resposta não é uma instância válida de thread.');
    }
} catch (error) {
    return error+'';
}
}

export function findThreadIdByNumber(numero: string) {
  createThreadsFileIfNotExists()
  try {
    const threadsData = JSON.parse(fs.readFileSync('src/threads.json', 'utf8'));
    return threadsData[numero] || null;
  } catch (error) {
    return null;
  }
}

function createThreadsFileIfNotExists() {
    const threadsFilePath = 'src/threads.json';

    if (!fs.existsSync(threadsFilePath)) {
        // O arquivo não existe, vamos criá-lo com um objeto vazio
        fs.writeFileSync(threadsFilePath, JSON.stringify({}, null, 2));
        console.log(`Arquivo ${threadsFilePath} criado com sucesso!`);
    } else {
        console.log(`O arquivo ${threadsFilePath} já existe.`);
    }
}