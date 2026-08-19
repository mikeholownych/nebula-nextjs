import React from 'react';
import Hero from './components/Hero';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#080909] text-[#e8ebe7] antialiased selection:bg-[#c7ff2f]/20 selection:text-[#c7ff2f]">
      <main>
        <Hero />
      </main>
    </div>
  );
};

export default App;
