export default function OGCardSource() {
  return (
    <div className="min-h-[630px] w-[1200px] overflow-hidden bg-bg flex flex-col justify-center items-start p-[72px_80px] relative">
      <div className="absolute top-[90px] right-[-80px] w-[480px] h-[480px] rounded-full bg-accent/25 blur-[100px]" />
      <div className="text-accent/80 text-lg font-semibold tracking-wider uppercase mb-6">
        Evidence-backed conversion diagnosis
      </div>
      <h1 className="text-white text-[62px] leading-[1.06] tracking-[-0.03em] max-w-[860px] mb-5 font-extrabold">
        Your landing page is <em className="text-accent not-italic">leaking buyers.</em>
      </h1>
      <p className="text-fg-muted text-[23px] max-w-[760px] leading-[1.4] mb-10">
        Automated URL submission and scoring are live - every finding is backed by verifiable evidence.
      </p>
      <div className="flex gap-3.5">
        <div className="bg-bg-surface border border-accent/40 text-gray-300 text-[15px] px-[18px] py-[9px] rounded-full">
          🎯 Clarity
        </div>
        <div className="bg-bg-surface border border-accent/40 text-gray-300 text-[15px] px-[18px] py-[9px] rounded-full">
          🖱️ CTA friction
        </div>
        <div className="bg-bg-surface border border-accent/40 text-gray-300 text-[15px] px-[18px] py-[9px] rounded-full">
          🤝 Trust gap
        </div>
        <div className="bg-bg-surface border border-accent/40 text-gray-300 text-[15px] px-[18px] py-[9px] rounded-full">
          📦 Offer specificity
        </div>
        <div className="bg-bg-surface border border-accent/40 text-gray-300 text-[15px] px-[18px] py-[9px] rounded-full">
          🔧 Difficulty
        </div>
      </div>
      <div className="absolute bottom-12 right-[80px] text-fg-dim text-base font-semibold">
        nebulacomponents.com
      </div>
    </div>
  );
}
