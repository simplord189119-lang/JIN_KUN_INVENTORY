import { useState, useEffect } from 'react';
import { wuwaData } from './data';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pity, setPity] = useState({ charEvent: 0, weapEvent: 0, charStd: 0, weapStd: 0 });
  const [priorities, setPriorities] = useState({});
  const [conveneData, setConveneData] = useState([]);

  // Mock function to simulate data import from history
  const handleImport = () => {
    alert("Importing convene history...");
    // Future logic: parse JSON history here
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Navigation Header */}
      <nav className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-xl font-bold text-cyan-400">JIN_STRIKE.INVENTORY</h1>
        <button className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold">Sync / Login</button>
      </nav>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['dashboard', 'resonators', 'weapons', 'convene'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded capitalize ${activeTab === tab ? 'bg-cyan-400 text-black' : 'bg-gray-800'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Content */}
      <main>
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-4">
            {['Char. Event', 'Weap. Event', 'Char. Std', 'Weap. Std'].map(stat => (
              <div key={stat} className="bg-gray-900 border border-gray-700 p-4 rounded text-center">
                <p className="text-gray-400 text-xs uppercase">{stat}</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'convene' && (
          <div className="bg-gray-900 p-6 rounded border border-gray-700">
            <h2 className="font-bold mb-4">Convene Import</h2>
            <button onClick={handleImport} className="w-full bg-cyan-600 py-2 rounded font-bold">Parse Link</button>
          </div>
        )}

        {(activeTab === 'resonators' || activeTab === 'weapons') && (
          <div className="grid grid-cols-1 gap-4">
            {wuwaData.filter(item => activeTab === 'resonators' ? item.rarity : item.signatureWeapon).map(item => (
              <div key={item.id} className="bg-gray-900 p-4 rounded flex justify-between items-center border border-gray-800">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-xs text-gray-400">{activeTab === 'resonators' ? item.element : item.weaponType}</p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-gray-700 px-3 py-1 rounded text-xs">MUST</button>
                  <button className="bg-gray-700 px-3 py-1 rounded text-xs">HIGH</button>
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
