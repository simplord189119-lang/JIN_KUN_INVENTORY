import React, { useState, useEffect } from "react";
import { CHARACTERS } from "./data.js";
import { WEAPONS } from "./weaponsData.js";

export default function JinKunInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pity, setPity] = useState({ charEvent: 0, weapEvent: 0, charStd: 0, weapStd: 0 });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Header & Sync */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-electric-blue">JIN_KUN.INVENTORY</h1>
        <button onClick={() => setIsLoggedIn(true)} className="bg-yellow-600 px-4 py-1 rounded text-xs font-bold uppercase">
          {isLoggedIn ? "Synced" : "Sync / Login"}
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2 overflow-x-auto">
        {["dashboard", "resonators", "weapons", "convene", "analytics"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`capitalize text-sm ${activeTab === tab ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded border border-white/10 text-center">
              <div className="text-2xl font-bold">{pity.charEvent}</div>
              <div className="text-[10px] text-gray-400 uppercase">Char. Event</div>
            </div>
            {/* Repeat for other pity counters... */}
          </div>
          <div className="text-xs text-gray-500 uppercase mt-4">Must-pull characters</div>
        </div>
      )}

      {/* Resonator/Weapon Priority View */}
      {(activeTab === "resonators" || activeTab === "weapons") && (
        <div className="grid grid-cols-2 gap-4">
          {(activeTab === "resonators" ? CHARACTERS : WEAPONS).map((item) => (
            <div key={item.id} className="bg-slate-900 p-4 rounded border border-white/10 relative">
              <div className="text-lg font-bold">{item.name}</div>
              <div className="flex gap-2 mt-2">
                <button className="text-[8px] bg-slate-700 px-2 py-1 rounded">MUST</button>
                <button className="text-[8px] bg-slate-700 px-2 py-1 rounded">HIGH</button>
                <button className="text-[8px] bg-slate-700 px-2 py-1 rounded">LOW</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
