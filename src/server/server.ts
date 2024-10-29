import express from 'express';
import { WASocket } from '@whiskeysockets/baileys';
import { handleUpsert } from '../whatsappEvents/messagesEvent/handleUpsert';
import { createRoutes } from './routes';
import { tokenValited } from './middlewares/auth'; // Importando o middleware
import openaiRoutes from './routes/openaiRoutes';

export function startServer(sock: WASocket) {
  /*const app = express();
  app.use(express.json());

  app.use(createRoutes(sock));
  //app.use(openaiRoutes)

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });

  return app;*/
}
