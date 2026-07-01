import React, { useState, useEffect } from "react";
import { CHARACTERS } from "./data.js";
import { WEAPONS } from "./weaponsData.js";

export default function JinKunInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bgImage, setBgImage] = useState(() => localStorage.getItem("customBg") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Background Wallpaper Effect
  useEffect(() => {
    const root = document.body;
    if (bgImage) {
      root.style.backgroundImage = `linear-gradient(rgba(8, 11, 22, 0.9), rgba(8, 11, 22, 0.95)), url(${bgImage})`;
      root.style.backgroundSize = "cover";
      root.style.backgroundAttachment = "fixed";
    }
  }, [bgImage]);

  const handleBgChange = () => {
    const url = prompt("Enter the URL of your custom background image:");
    if (url) {
      setBgImage(url);
      localStorage.setItem("customBg", url);
    }
  };

  const handleLogin = () => {
    const email = prompt("Enter your email to sync/login:");
    if (email) {
      setIsLoggedIn(true);
      alert(`Dashboard synced for: ${email}`);
    }
  };

  return (
    <div className="min-h-screen text-ivory p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-electric-blue">JIN_KUN.INVENTORY</h1>
        <button onClick={handleLogin} className="bg-electric-blue text-black px-4 py-1 rounded text-xs font-bold uppercase">
          {isLoggedIn ? 'Synced' : 'Login'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2 overflow-x-auto">
        {["dashboard", "resonators", "weapons", "convene", "analytics"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`capitalize text-sm whitespace-nowrap ${activeTab === tab ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Rendering */}
      <div className="tab-content">
        {activeTab === "dashboard" && <div className="text-center mt-10">Welcome, Rover.</div>}
        
        {activeTab === "resonators" && (
          <div className="grid grid-cols-2 gap-4">
            {CHARACTERS.map((char) => (
              <div key={char.id} className="p-4 bg-slate-800 rounded border border-white/10">
                <span className="text-sm font-bold">{char.name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "weapons" && (
          <div className="grid grid-cols-2 gap-4">
            {WEAPONS.map((weapon) => (
              <div key={weapon.id} className="p-4 bg-slate-800 border-l-4 border-yellow-500 rounded border border-white/10">
                <span className="text-sm font-bold text-yellow-500">{weapon.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-10 pt-4 border-t border-white/10 flex gap-4">
        <button onClick={handleBgChange} className="text-[10px] text-starlightDim uppercase">Change BG</button>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[10px] text-red-500 uppercase">Reset Data</button>
      </div>
    </div>
  );
}
