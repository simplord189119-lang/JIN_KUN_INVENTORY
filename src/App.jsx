import { useState, useEffect } from 'react';
import { wuwaData } from './data';
import { Search, Image as ImageIcon, LogIn } from 'lucide-react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedBg = localStorage.getItem('customBg');
    if (savedBg) setBgImage(savedBg);
  }, []);

  const handleBgChange = () => {
    const url = prompt("Enter the URL of your custom background image:");
    if (url) {
      setBgImage(url);
      localStorage.setItem('customBg', url);
    }
  };

  const filteredCharacters = wuwaData.filter(char => 
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.signatureWeapon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className="min-h-screen bg-wuwa-dark bg-cover bg-center bg-no-repeat bg-fixed"
      style={bgImage ? { backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url(${bgImage})` } : {}}
    >
      <nav className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/50 backdrop-blur-md">
        <h1 className="text-xl font-bold tracking-widest border-b-2 border-electric-blue text-white">
          JIN_KUN.INVENTORY
        </h1>
        <div className="flex gap-4">
          <button onClick={handleBgChange} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">
            <ImageIcon size={16} className="text-electric-blue" /> Background
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-electric-blue text-black font-semibold rounded hover:bg-cyan-400 transition-colors">
            <LogIn size={16} /> {isLoggedIn ? 'Profile' : 'Login'}
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-6xl mx-auto">
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search characters or weapons..." 
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-electric-blue transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCharacters.map(char => (
            <div key={char.id} className="bg-gray-800/80 border border-gray-700 p-4 rounded-xl hover:border-electric-blue transition-all group">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold group-hover:text-electric-blue transition-colors">{char.name}</h2>
                <span className="text-xs font-bold px-2 py-1 bg-gray-900 rounded border border-gray-600">
                  {char.element}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">Signature Weapon:</p>
                <p className="text-sm font-semibold text-wuwa-yellow">{char.signatureWeapon}</p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button className="flex-1 bg-gray-700 hover:bg-electric-blue hover:text-black text-xs py-1 rounded transition-colors">MUST</button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs py-1 rounded transition-colors">HIGH</button>
                <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-xs py-1 rounded transition-colors">LOW</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
