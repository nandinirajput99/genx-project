import { useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-purple-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-2xl font-bold tracking-wide">
          Kwizz
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="hover:text-yellow-300 transition">Home</a>
          
          <a href="/join" className="hover:text-yellow-300 transition">Join Quiz</a>
          
          <button className="bg-yellow-400 text-purple-900 font-semibold px-4 py-1.5 rounded-full hover:bg-yellow-300 transition">
            Login
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-4 pb-4">
          <a href="/" className="hover:text-yellow-300">Home</a>
          
          <a href="/join" className="hover:text-yellow-300">Join Quiz</a>
          
          <button className="bg-yellow-400 text-purple-900 font-semibold px-4 py-1.5 rounded-full w-fit">
            Login
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;