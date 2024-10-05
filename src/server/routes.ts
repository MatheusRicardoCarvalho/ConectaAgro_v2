import { Router } from "express";
import { handleUpsert, MessageUpsert } from "../whatsappEvents/messagesEvent/handleUpsert";
import { WASocket } from "@whiskeysockets/baileys";
import jsonwebtoken from "jsonwebtoken";
import dotenv from 'dotenv';
import { AuthorizedApp, ExtendedMessagesItem, ExtendedSendMessage, SendMessage} from "./@server/types";
import { tokenValited } from "./middlewares/auth";

dotenv.config();

const appAuthorizedApi: AuthorizedApp[] = JSON.parse(process.env.APP_AUTHORIZED_API as string);
const appAuthorized = appAuthorizedApi[0]

export const createRoutes = (sock: WASocket) => {
  const routes = Router();

  routes.get("/test", (req, res) => {
    res.send("Hello World");
  });
  routes.post('/login', (req, res) => {
    const {app, key} = req.body
  
    try {
      const authorization = app === appAuthorized.app && key === appAuthorized.key;
  
      if (!authorization) return res.status(401).send('Password or E-mail incorrect!');
  
      const token = jsonwebtoken.sign(
        { app: JSON.stringify(appAuthorized) },
        appAuthorized.key,
        { expiresIn: '30d' }
      );
  
      return res.status(200).json({ data: { app: appAuthorized.app, token } });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  });

  routes.use(tokenValited)

  routes.post("/message", async (req, res) => {
    try {
        let data: ExtendedSendMessage
        const dataReq = req.body as SendMessage
        data = prepareData(dataReq)
      const result = await handleUpsert(data, sock, dataReq.appId, dataReq.cpf);
      if (result.success) {
        res.status(200).json({ success: true, response: result.response });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Erro interno do servidor" });
    }
  });

  

  return routes;
};


function prepareData(dataReq: SendMessage): ExtendedSendMessage {
    // Mapeando as mensagens e adicionando a propriedade `key`
    const extendedMessages = dataReq.messages.map(messageItem => {
      const extendedMessageItem: ExtendedMessagesItem = {
        ...messageItem,
        key: {
          remoteJid: "demeter",
          fromMe: false
        },
        userId: '1',
        app: true
      };
      return extendedMessageItem;
    });
  
    return {
      ...dataReq,
      type: "notify",
      messages: extendedMessages
    };
  }