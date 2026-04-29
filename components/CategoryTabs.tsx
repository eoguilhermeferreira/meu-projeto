"use client";

import type { Categoria } from "@/types/cardapio";

export default function CategoryTabs({
  categorias,
  ativa,
  onChange,
}: {
  categorias: Pick<Categoria, "id" | "nome" | "icone">[];
  ativa: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav aria-label="Categorias do cardápio" className="sticky top-[68px] z-30 bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-2">
        <div className="flex overflow-x-auto gap-1 py-2 scrollbar-hide">
          {categorias.map((cat) => {
            const isActive = cat.id === ativa;
            return (
              <button
                key={cat.id}
                onClick={() => onChange(cat.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-primary"
                }`}
              >
                <span aria-hidden="true">{cat.icone}</span>
                {cat.nome}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
