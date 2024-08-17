// src/logger/Logger.ts
import fs from 'fs';
import path from 'path';
import { LogLevel } from './LogLevel';

export class Logger {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.resolve(__dirname, '../../logs_conecta_system.log');
  }

  private writeLog(level: LogLevel, message: string): void {
    const logMessage = `${new Date().toISOString()} [${level}] ${message}\n`;
    fs.appendFileSync(this.logFilePath, logMessage, { encoding: 'utf8' });
  }

  public info(message: string): void {
    this.writeLog(LogLevel.INFO, message);
  }

  public error(message: string): void {
    this.writeLog(LogLevel.ERROR, message);
  }

  public debug(message: string): void {
    this.writeLog(LogLevel.DEBUG, message);
  }

  public warn(message: string): void {
    this.writeLog(LogLevel.WARN, message);
  }
}
