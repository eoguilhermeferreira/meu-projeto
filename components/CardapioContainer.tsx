"use client";

import { useMemo, useState } from "react";
import type { Categoria } from "@/types/cardapio";
import CategoryTabs from "./CategoryTabs";
import ItemCard from "./ItemCard";

export default function CardapioContainer({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const [categoriaAtiva, setCategoriaAtiva] = useState(categorias[0]?.id ?? "");

  const categoriaAtual = useMemo(
    () => categorias.find((c) => c.id === categoriaAtiva),
    [categorias, categoriaAtiva]
  );

  return (
    <>
      <CategoryTabs
        categorias={categorias}
        ativa={categoriaAtiva}
        onChange={setCategoriaAtiva}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {categoriaAtual?.subcategorias.map((sub) => {
          if (sub.itens.length === 0) return null;
          return (
            <section key={sub.id} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-primary">{sub.nome}</h2>
                <hr className="flex-1 border-t border-purple-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sub.itens.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
