import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import dotenv from 'dotenv';
import { AuthorizedApp, TokenPayload } from "../@server/types";

dotenv.config();



const appAuthorizedApi: AuthorizedApp[] = JSON.parse(process.env.APP_AUTHORIZED_API as string);
const appAuthorized = appAuthorizedApi[0]


export function tokenValited(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const [, token] = request.headers.authorization?.split(' ') || [' ', ' '];
  
  if(!token) return response.status(401).send('Access denied. No token provided.');

  try {
    const payload = jsonwebtoken.verify(token, appAuthorized.key);
    const {app} = payload as TokenPayload;

    if(!app) {
      return response.send(401).json({ message: 'Invalid token' });
    }

    request.headers['app'] = app.app;

    return next();
  } catch(error) {
    console.log(error);
    return response.status(401).json({ message: 'Invalid token' });
  }
}