export interface RequestAgricultorFilterDTO {
    id?: number;
    nome?: string;
    idade?: number;
    genero?: string;
    localidade?: string;
    telefone?: string;
    email?: string | null;
    escolaridade?: string;
    tamanhoPropriedade?: string;
    culturas?: string[];
    thread?: string[];
    municipioId?: number;
}