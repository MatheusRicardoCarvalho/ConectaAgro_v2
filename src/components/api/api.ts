import axios from "axios";

export const api = axios.create({
    baseURL: 'https://a3jzgzu7kf.execute-api.sa-east-1.amazonaws.com/',
  });
