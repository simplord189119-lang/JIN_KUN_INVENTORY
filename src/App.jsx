
export default function JinKunInventory() {
  const [bgImage, setBgImage] = useState(() => localStorage.getItem("customBg") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("resonators");

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

  useEffect(() => {
    const root = document.querySelector('body');
    if (bgImage) {
      root.style.backgroundImage = `linear-gradient(rgba(8, 11, 22, 0.9), rgba(8, 11, 22, 0.95)), url(${bgImage})`;
      root.style.backgroundSize = "cover";
      root.style.backgroundAttachment = "fixed";
    }
  }, [bgImage]);

  return (
    <div className="min-h-screen relative overflow-hidden text-ivory">
      <Backdrop />

      {/* Navigation Bar */}
      <div className="flex gap-3 px-4 py-2 border-b border-white/10 mb-4 justify-between">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("resonators")} className="text-xs uppercase tracking-wider text-ivory">Resonators</button>
          <button onClick={() => setActiveTab("weapons")} className="text-xs uppercase tracking-wider text-ivory">Weapons</button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBgChange} className="text-[10px] uppercase text-starlightDim">BG</button>
          <button onClick={handleLogin} className="text-[10px] uppercase text-goldDim">{isLoggedIn ? 'Synced' : 'Login'}</button>
          <button onClick={() => { localStorage.removeItem("customBg"); setBgImage(""); }} className="text-[10px] uppercase text-red-500">Reset</button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "resonators" && (
        <div className="grid grid-cols-3 gap-4 p-4">
          {CHARACTERS.map((char) => (
            <div key={char.id} className="flex flex-col">
              <Portrait character={char} />
              <span className="text-[10px] mt-1 text-center truncate">{char.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
