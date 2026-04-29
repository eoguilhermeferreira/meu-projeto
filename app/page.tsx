import cardapioData from "@/data/cardapio.json";
import type { Categoria } from "@/types/cardapio";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import CardapioContainer from "@/components/CardapioContainer";

export default function Home() {
  const { estabelecimento, categorias: categoriasRaw } = cardapioData;
  const categorias = categoriasRaw as unknown as Categoria[];

  return (
    <div className="min-h-screen">
      <Header nome={estabelecimento.nome} />
      <CardapioContainer categorias={categorias} />
      <WhatsAppButton
        whatsapp={estabelecimento.whatsapp}
        mensagem={estabelecimento.mensagemWhatsapp}
      />
    </div>
  );
}
