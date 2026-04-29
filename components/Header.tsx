export default function Header({ nome }: { nome: string }) {
  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center">
        <h1 className="text-2xl md:text-4xl font-bold tracking-wide">{nome}</h1>
      </div>
    </header>
  );
}
