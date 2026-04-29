import { memo } from "react";
import type { Item } from "@/types/cardapio";

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function PriceEntry({ label, valor, single }: { label: string; valor: number; single: boolean }) {
  if (single) {
    return (
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="font-bold text-lg text-primary">{fmt.format(valor)}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center bg-purple-50 rounded-xl p-2">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="font-bold text-lg text-primary">{fmt.format(valor)}</span>
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const precoEntries = Object.entries(item.precos);
  const single = precoEntries.length === 1;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-200 flex flex-col gap-2">
      <h3 className="font-bold text-[#333333] text-base leading-tight">{item.nome}</h3>
      {item.descricao && (
        <p className="text-sm text-gray-500 leading-snug">{item.descricao}</p>
      )}
      <div className={`mt-auto ${single ? "" : "grid grid-cols-2 gap-2 pt-2"}`}>
        {precoEntries.map(([label, valor]) => (
          <PriceEntry key={label} label={label} valor={valor} single={single} />
        ))}
      </div>
    </div>
  );
}

export default memo(ItemCard);
