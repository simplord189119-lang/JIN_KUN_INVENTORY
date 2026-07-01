import React, { useState, useEffect } from "react";
import { CHARACTERS } from "./data.js";
import { WEAPONS } from "./weaponsData.js";

export default function JinKunInventory() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bgImage, setBgImage] = useState(() => localStorage.getItem("customBg") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (bgImage) {
      document.body.style.backgroundImage = `url(${bgImage})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundAttachment = "fixed";
    }
  }, [bgImage]);

  return (
    <div className="min-h-screen text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-blue-400">JIN_KUN.INVENTORY</h1>
        <button onClick={() => setIsLoggedIn(true)} className="bg-blue-500 px-3 py-1 rounded text-xs">
          {isLoggedIn ? "Synced" : "Login"}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-700 pb-2 mb-6">
        {["dashboard", "resonators", "weapons"].map((tab) => (
          <button key={tab} className="capitalize text-sm" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && <div className="text-center">Welcome, Rover.</div>}
      {activeTab === "resonators" && <div className="grid grid-cols-2 gap-4">{CHARACTERS.map(c => <div key={c.id} className="p-4 bg-slate-800">{c.name}</div>)}</div>}
      {activeTab === "weapons" && <div className="grid grid-cols-2 gap-4">{WEAPONS.map(w => <div key={w.id} className="p-4 bg-slate-800 border-l-4 border-yellow-500">{w.name}</div>)}</div>}
      
      <button onClick={() => setBgImage(prompt("Enter Image URL:"))} className="mt-10 text-xs text-gray-400">Change Wallpaper</button>
    </div>
  );
}
