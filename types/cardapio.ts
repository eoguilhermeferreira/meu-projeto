export type Item = {
  id: string;
  nome: string;
  descricao: string;
  precos: Record<string, number>;
};

export type Subcategoria = {
  id: string;
  nome: string;
  itens: Item[];
};

export type Categoria = {
  id: string;
  nome: string;
  icone: string;
  subcategorias: Subcategoria[];
};
