import { useState, useEffect } from 'react';
import { wuwaData } from './data';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pity, setPity] = useState({ charEvent: 0, weapEvent: 0, charStd: 0, weapStd: 0 });
  const [priorities, setPriorities] = useState({});

  useEffect(() => {
    const savedPity = localStorage.getItem('wuwaPity');
    if (savedPity) setPity(JSON.parse(savedPity));
    const savedPriorities = localStorage.getItem('wuwaPriorities');
    if (savedPriorities) setPriorities(JSON.parse(savedPriorities));
  }, []);

  const updatePity = (type, val) => {
    const newPity = { ...pity, [type]: val };
    setPity(newPity);
    localStorage.setItem('wuwaPity', JSON.stringify(newPity));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="flex justify-between items-center p-4 border-b border-gray-800 bg-black/60 sticky top-0 z-10">
        <h1 className="text-xl font-bold tracking-widest text-cyan-400">JIN_STRIKE.INVENTORY</h1>
        <button className="px-4 py-2 bg-yellow-500 text-black font-bold rounded text-xs">Sync Data</button>
      </nav>

      <div className="flex justify-center gap-2 p-4">
        {['dashboard', 'resonators', 'weapons', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-cyan-400 text-black' : 'bg-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(pity).map(type => (
              <div key={type} className="bg-gray-900 p-4 rounded border border-gray-700">
                <p className="text-xs text-gray-400 uppercase">{type}</p>
                <input type="number" value={pity[type]} onChange={(e) => updatePity(type, e.target.value)} className="bg-transparent text-2xl font-bold w-full outline-none" />
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'resonators' || activeTab === 'weapons') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wuwaData.filter(item => activeTab === 'resonators' ? item.rarity : item.signatureWeapon).map(item => (
              <div key={item.id} className="bg-gray-900 p-4 rounded border border-gray-800">
                <h3 className="font-bold">{item.name}</h3>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setPriorities({...priorities, [item.id]: 'must'})} className={`px-2 py-1 rounded text-xs ${priorities[item.id] === 'must' ? 'bg-cyan-400 text-black' : 'bg-gray-800'}`}>MUST</button>
                  <button onClick={() => setPriorities({...priorities, [item.id]: 'high'})} className={`px-2 py-1 rounded text-xs ${priorities[item.id] === 'high' ? 'bg-yellow-400 text-black' : 'bg-gray-800'}`}>HIGH</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
