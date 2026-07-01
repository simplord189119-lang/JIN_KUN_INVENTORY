import React, { useState, useEffect } from "react";
import { CHARACTERS } from "./data";
import { WEAPONS } from "./weaponsData";

export default function JinKunInventory() {
  const [bgImage, setBgImage] = useState(() => localStorage.getItem("customBg") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Default to Dashboard

  // Background Wallpaper Effect
  useEffect(() => {
    const root = document.querySelector('body');
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
      {/* Header / Nav */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-electric-blue">JIN_KUN.INVENTORY</h1>
        <button onClick={handleLogin} className="bg-electric-blue text-black px-4 py-1 rounded text-xs font-bold">
          {isLoggedIn ? 'Synced' : 'Login'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6 pb-2">
        {["dashboard", "resonators", "weapons", "convene", "analytics"].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`capitalize text-sm ${activeTab === tab ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {activeTab === "dashboard" && <div className="text-center">Welcome, Rover. Track your pity here.</div>}
      
      {activeTab === "resonators" && (
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map(c => <div key={c.id} className="p-4 bg-slate-800 rounded">{c.name}</div>)}
        </div>
      )}

      {activeTab === "weapons" && (
        <div className="grid grid-cols-2 gap-4">
          {WEAPONS.map(w => <div key={w.id} className="p-4 bg-slate-800 border-l-4 border-yellow-500 rounded">{w.name}</div>)}
        </div>
      )}

      {/* Footer Controls */}
      <div className="mt-10 pt-4 border-t border-white/10 flex gap-4">
        <button onClick={handleBgChange} className="text-xs text-starlightDim">Change BG</button>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-xs text-red-500">Reset Data</button>
      </div>
    </div>
  );
}
