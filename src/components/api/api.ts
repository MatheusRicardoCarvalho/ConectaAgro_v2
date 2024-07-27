import axios from "axios";

export const api = axios.create({
    baseURL: 'https://gqcwhljkwj.execute-api.us-east-1.amazonaws.com/',
  });
