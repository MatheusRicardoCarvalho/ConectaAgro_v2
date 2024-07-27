interface ConnectDTO {
    id: number;
}

interface AgricultorIdDTO {
    connect: ConnectDTO;
}



export interface RequestMessageDTO {
    conteudo: string;
    remetente: 'USER' | 'BOT';
    agricultor: AgricultorIdDTO;
}
