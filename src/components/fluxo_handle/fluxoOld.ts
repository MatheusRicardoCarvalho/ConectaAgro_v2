import { ResponseAgricultorFilterDTO } from "../api/dtos/agricultor/ResponseAgricultorFilterDto";
import { RequestMessageDTO } from "../api/dtos/message/RequestMessageDto";
import { ResponseMessageDTO } from "../api/dtos/message/ResponseMessageDto";
import { convertToRequestAgricultorFilterDTO } from "../api/mappers/agricultor/convertToRequestAgricultorFilterDTO";
import { getLastBotMessage } from "../api/requests/get/getLastBotMessage";
import { createMessage } from "../api/requests/post/createMessage";
import { updateUser } from "../api/requests/update/updateUser";

const escolaridade = {
  1: "sem alfabetização",
  2: "ensino fundamental",
  3: "ensino médio",
  4: "ensino superior"
};

const genero = {
  1: "masculino",
  2: "feminino",
  3: "outro"
};

type escolaridadeKeyType = 1 | 2 | 3 | 4 | null;
type generoKeyType = 1 | 2 | 3 | null;

export async function fluxoHandleOld(user: ResponseAgricultorFilterDTO, messageUser: string | null | undefined): Promise<string> {
  const instructions = `Olá! Sou a atendente virtual da Prefeitura de Salgueiro.` +
    ` Antes de continuarmos preciso saber algumas informações sobre você, caso não queira responder basta enviar "não informar"\n\n`;

  const questions = [
    { key: 'nome', question: 'Qual é o seu nome?' },
    { key: 'idade', question: 'Qual é a sua idade? (digite o número)' },
    { key: 'genero', question: 'Qual é o seu gênero?\n\n Digite o número correspondente:\n1- Masculino\n2- Feminino\n3- Outro' },
    { key: 'localidade', question: 'Qual é a sua localidade? (Sítio, endereço, etc)' },
    { key: 'email', question: 'Qual é o seu e-mail? ' },
    { key: 'escolaridade', question: 'Qual é o seu grau de escolaridade?\n\n Digite o número correspondente:\n1- Sem alfabetização\n2- Ensino fundamental\n3- Ensino médio\n4- Ensino superior' },
    { key: 'tamanhoPropriedade', question: 'Qual é o tamanho da sua propriedade em hectares?' },
    { key: 'culturas', question: 'Quais culturas você cultiva? (separe por vírgula)\nexemplo: banana, maracujá, feijão' }
  ];

  const validateResponse = (key: string, response: string): boolean => {
    if (response.toLowerCase() === "não informar") {
      return true;
    }

    const decimalPattern = /^-?\d+(?:[\.,]\d+)?$/;

    switch (key) {
      case 'idade':
        return !isNaN(parseInt(response));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(response);
      case 'tamanhoPropriedade':
        return decimalPattern.test(response); // Valida se é um número decimal no formato brasileiro ou americano
      case 'escolaridade':
        const escolaridadeNum = parseInt(response);
        return !isNaN(escolaridadeNum) && escolaridadeNum >= 1 && escolaridadeNum <= 4;
      case 'genero':
        const generoNum = parseInt(response);
        return !isNaN(generoNum) && generoNum >= 1 && generoNum <= 3;
      case 'culturas':
        return response.trim().length > 0;
      default:
        return response.trim().length > 0;
    }
  };

  let lastQuestionKey: string | null = null;
  let nextQuestionKey: string | null = null;

  for (const { key, question } of questions) {
    if (key === 'culturas') {
      if (!user[key] || user[key].length === 0) {
        nextQuestionKey = key;
        break;
      }
    } else if (!user[key as keyof ResponseAgricultorFilterDTO]) {
      nextQuestionKey = key;
      break;
    }
    lastQuestionKey = key;
  }

  if (!nextQuestionKey) {
    return "Todas as perguntas foram respondidas.";
  }

  // caso seja o primeiro campo a ser respondido
  if (!lastQuestionKey) {
    const res = instructions + questions.find(q => q.key === nextQuestionKey)?.question;
    const lastBotMessage: ResponseMessageDTO = await getLastBotMessage(user.id);
    console.log("Aqui está a última mensagem: \n\n" + JSON.stringify(lastBotMessage));
    if (lastBotMessage == null || lastBotMessage.conteudo != res) {
      console.log("1 MENSAGEM \n\n")
      const dataMessage: RequestMessageDTO = { conteudo: res, remetente: 'BOT', agricultor: { connect: { id: user.id } } };
      await createMessage(dataMessage);
      return res;
    }
  }

  if (messageUser) {
    if (validateResponse(nextQuestionKey, messageUser)) {
      console.log("para continuar \n\n\n");
      const updatedUser = await updateAndSaveUser(user, nextQuestionKey, messageUser);
      if((nextQuestionKey == 'culturas' && messageUser && validateResponse(nextQuestionKey, messageUser))) return "fim questionario"
      for (const { key, question } of questions) {
        if (key === 'culturas') {
          if (!updatedUser[key] || updatedUser[key].length === 0) {
            nextQuestionKey = key;
            break;
          }
        } else if (!updatedUser[key as keyof ResponseAgricultorFilterDTO]) {
          nextQuestionKey = key;
          break;
        }
        lastQuestionKey = key;
      }
      const nextQuestion = questions.find(q => q.key === nextQuestionKey)?.question;
      const res = instructions + `${nextQuestion}`;
      const dataMessage: RequestMessageDTO = { conteudo: res, remetente: 'BOT', agricultor: { connect: { id: user.id } } };
      await createMessage(dataMessage);
      return res;
    } else {
      const repeatQuestion = questions.find(q => q.key === nextQuestionKey)?.question;
      return `Resposta inválida. \n\n ${repeatQuestion}`;
    }
  }

  return instructions + questions.find(q => q.key === nextQuestionKey)?.question;
}

type ResponseAgricultorFilterDTOKeys = keyof ResponseAgricultorFilterDTO;

async function updateAndSaveUser(user: ResponseAgricultorFilterDTO, key: string, response: string) {
  const updatedUser = { ...user };

  if (response.toLowerCase() === "não informar") {
    switch (key) {
      case 'idade':
        updatedUser.idade = -1; // Valor padrão para idade não informada
        break;
      case 'email':
        updatedUser.email = "não informado";
        break;
      case 'culturas':
        updatedUser.culturas = ["não informado"];
        break;
      default:
        if (key in updatedUser) {
          (updatedUser as any)[key] = "não informado";
        }
        break;
    }
  } else {
    switch (key) {
      case 'idade':
        updatedUser.idade = parseInt(response);
        break;
      case 'tamanhoPropriedade':
        updatedUser.tamanhoPropriedade = parseFloat(response.replace(',', '.')); // Converte vírgula para ponto
        break;
      case 'culturas':
        updatedUser.culturas = response.split(',').map(cultura => cultura.trim());
        break;
      case 'escolaridade':
        const escolaridadeNum = parseInt(response);
        const escolaridadeKey: escolaridadeKeyType = escolaridadeNum as escolaridadeKeyType;
        if (escolaridadeKey && escolaridadeKey in escolaridade) {
          updatedUser.escolaridade = escolaridade[escolaridadeKey];
        } else {
          updatedUser.escolaridade = "não informado";
        }
        break;
      case 'genero':
        const generoNum = parseInt(response);
        const generoKey: generoKeyType = generoNum as generoKeyType;
        if (generoKey && generoKey in genero) {
          updatedUser.genero = genero[generoKey];
        } else {
          updatedUser.genero = "não informado";
        }
        break;
      default:
        if (key in updatedUser) {
          (updatedUser as any)[key] = response;
        }
        break;
    }
  }

  // Atualize o usuário no banco de dados
  await updateUser(convertToRequestAgricultorFilterDTO(updatedUser), user.id);
  return updatedUser;
}
