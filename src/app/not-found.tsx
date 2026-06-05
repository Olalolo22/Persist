

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0F0E0C] text-[#F0EDE6] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="font-serif text-4xl italic text-[#B8974A] mb-4 font-light">404</h1>
      <h2 className="font-serif text-xl italic text-[#F0EDE6]/80 mb-2 font-light">Capsule Not Found</h2>
      <p className="text-xs text-[#8C8578] mb-8 max-w-xs leading-relaxed">
        This heirloom capsule or page does not exist on the blockchain or the aggregator.
      </p>
      <a href="/">
        <span className="bg-transparent text-[#8C8578] border border-[#2E2B25] px-6 py-2.5 rounded-md text-xs hover:text-[#F0EDE6] hover:border-[#8C8578] transition-colors cursor-pointer inline-block font-sans">
          Return to Dashboard
        </span>
      </a>
    </main>
  );
}
