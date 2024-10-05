import express from 'express';
import { WASocket } from '@whiskeysockets/baileys';
import { handleUpsert } from '../whatsappEvents/messagesEvent/handleUpsert';
import { createRoutes } from './routes';
import { tokenValited } from './middlewares/auth'; // Importando o middleware

export function startServer(sock: WASocket) {
  const app = express();
  app.use(express.json());

  app.use(createRoutes(sock));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });

  return app;
}
