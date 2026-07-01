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
    }
  }, [bgImage]);

  return (
    <div className="p-4 text-ivory">
      {/* Navigation */}
      <div className="flex gap-4 border-b border-white/10 pb-2 mb-6">
        {["dashboard", "resonators", "weapons"].map((tab) => (
          <button key={tab} className="capitalize" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Logic to display data */}
      {activeTab === "resonators" && <div>Loaded {CHARACTERS.length} resonators.</div>}
      {activeTab === "weapons" && <div>Loaded {WEAPONS.length} weapons.</div>}
    </div>
  );
}
