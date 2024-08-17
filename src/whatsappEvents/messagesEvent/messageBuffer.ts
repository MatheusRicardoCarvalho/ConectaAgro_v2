// messageBuffer.ts

type BufferData = {
    messages: string[];
    timeout: NodeJS.Timeout | null;
  };
  
  const messageBuffer = new Map<string, BufferData>();
  const DELAY = 1000; // 1 segundo
  
  export function addMessageToBuffer(phone: string, message: string, processMessages: (combinedMessage: string) => void) {
      let bufferData = messageBuffer.get(phone);
  
      if (!bufferData) {
          bufferData = { messages: [], timeout: null };
          messageBuffer.set(phone, bufferData);
      }
  
      bufferData.messages.push(message);
  
      if (bufferData.timeout) {
          clearTimeout(bufferData.timeout);
      }
  
      bufferData.timeout = setTimeout(() => {
          const bufferDataFinal = messageBuffer.get(phone);
  
          if (bufferDataFinal) { // Verificação adicional
              const combinedMessage = bufferDataFinal.messages.join(' ');
              messageBuffer.delete(phone);
              processMessages(combinedMessage);
          }
      }, DELAY);
  }
  