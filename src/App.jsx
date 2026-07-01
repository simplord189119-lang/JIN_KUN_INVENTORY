import { useState, useEffect } from 'react';
import { wuwaData } from './data';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [priorities, setPriorities] = useState({});

  useEffect(() => {
    const savedBg = localStorage.getItem('customBg');
    if (savedBg) setBgImage(savedBg);
    
    const savedPriorities = localStorage.getItem('wuwaPriorities');
    if (savedPriorities) setPriorities(JSON.parse(savedPriorities));
  }, []);

  const handleBgChange = () => {
    const url = prompt("Enter the URL of your custom background image:");
    if (url) {
      setBgImage(url);
      localStorage.setItem('customBg', url);
    }
  };

  const handlePriorityChange = (charId, level) => {
    const newPriorities = { ...priorities, [charId]: level };
    setPriorities(newPriorities);
    localStorage.setItem('wuwaPriorities', JSON.stringify(newPriorities));
  };

  const filteredCharacters = wuwaData.filter(char => 
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.signatureWeapon.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.weaponType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen bg-slate-950 bg-cover bg-center bg-no-repeat bg-fixed text-white"
      style={bgImage ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url(${bgImage})` } : {}}
    >
      <nav className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/60 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-widest border-b-2 border-cyan-400 text-white">
          JIN_STRIKE.INVENTORY
        </h1>
        <div className="flex gap-4">
          <button onClick={handleBgChange} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-700 text-cyan-400 font-semibold">
            Custom BG
          </button>
          <button className="px-4 py-2 bg-cyan-400 text-black font-bold rounded text-xs hover:bg-cyan-300">
            {isLoggedIn ? 'Dashboard' : 'Login / Sync'}
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="relative mb-8 max-w-2xl mx-auto">
          <input 
            type="text" 
            placeholder="Search characters, elements, or weapons..." 
            className="w-full bg-gray-900/90 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-cyan-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCharacters.map(char => (
            <div key={char.id} className="bg-gray-900/80 border border-gray-800 p-5 rounded-xl hover:border-cyan-400 transition-all group backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold group-hover:text-cyan-400 transition-colors">{char.name}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${char.rarity === 5 ? 'bg-yellow-900/30 border-yellow-400 text-yellow-400' : 'bg-purple-900/30 border-purple-400 text-purple-400'}`}>
                  {char.rarity}★
                </span>
              </div>
              
              <div className="mt-3 flex gap-2">
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{char.element}</span>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">{char.weaponType}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Signature Weapon</p>
                <p className="text-sm font-semibold text-yellow-400 truncate">
                  {char.signatureWeapon}
                </p>
              </div>
              
              <div className="flex gap-2 mt-5">
                <button 
                  onClick={() => handlePriorityChange(char.id, 'must')}
                  className={`flex-1 text-xs py-2 rounded font-bold transition-colors ${priorities[char.id] === 'must' ? 'bg-cyan-400 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  MUST
                </button>
                <button 
                  onClick={() => handlePriorityChange(char.id, 'high')}
                  className={`flex-1 text-xs py-2 rounded font-bold transition-colors ${priorities[char.id] === 'high' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                  HIGH
                </button>
                <button 
                  onClick={() => handlePriorityChange(char.id, 'low')}
                  className={`flex-1 text-xs py-2 rounded font-bold transition-colors ${priorities[char.id] === 'low' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}
                >
                  LOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
