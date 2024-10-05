import dotenv from "dotenv";
import { AuthorizedApp } from "../server/@server/types";

dotenv.config();
const appAuthorizedApi: AuthorizedApp[] = JSON.parse(
  process.env.APP_AUTHORIZED_API as string
);
const appAuthorized = appAuthorizedApi[0];

export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

export function isAuthorizedApp(str: string): boolean {
  if (isNumeric(str)) return false;
  const normalizedStr = str.trim().toLowerCase();
  const normalizedApp = appAuthorized.app.trim().toLowerCase();

  return normalizedApp === normalizedStr;
  return false;
}
