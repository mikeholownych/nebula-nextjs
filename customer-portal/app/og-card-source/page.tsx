export default function OGCardSource() {
  return (
    <div className="min-h-[630px] w-[1200px] overflow-hidden bg-gray-900 flex flex-col justify-center items-start p-[72px_80px]">
      <div className="text-emerald-300 text-lg font-semibold tracking-wider uppercase mb-5">
        Evidence-backed scoring rebuild in progress
      </div>
      <h1 className="text-white text-[56px] leading-[1.08] tracking-tight max-w-[800px] mb-7">
        Your landing page is <em className="text-emerald-300 not-italic">leaking buyers.</em>
      </h1>
      <p className="text-gray-400 text-[22px] max-w-[700px] leading-[1.4] mb-10">
        Automated URL submission and scoring are paused until every finding can be backed by verifiable evidence.
      </p>
      <div className="flex gap-4">
        <div className="bg-gray-800 border border-gray-700 text-gray-300 text-[15px] px-[18px] py-2 rounded-full">
          🎯 Clarity
        </div>
        <div className="bg-gray-800 border border-gray-700 text-gray-300 text-[15px] px-[18px] py-2 rounded-full">
          🖱️ CTA friction
        </div>
        <div className="bg-gray-800 border border-gray-700 text-gray-300 text-[15px] px-[18px] py-2 rounded-full">
          🤝 Trust gap
        </div>
        <div className="bg-gray-800 border border-gray-700 text-gray-300 text-[15px] px-[18px] py-2 rounded-full">
          📦 Offer specificity
        </div>
        <div className="bg-gray-800 border border-gray-700 text-gray-300 text-[15px] px-[18px] py-2 rounded-full">
          🔧 Difficulty
        </div>
      </div>
      <div className="absolute bottom-12 right-[72px] text-gray-400 text-base">
        nebulacomponents.shop
      </div>
    </div>
  );
}
