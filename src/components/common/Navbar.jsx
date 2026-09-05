import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = localStorage.getItem("userLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
      setUserNickname(localStorage.getItem("userNickname") || localStorage.getItem("userEmail") || "Player");
    };

    checkAuth();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userNickname");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav className="bg-[#120a2e] text-white shadow-md border-b border-purple-900/60 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link
          to={isLoggedIn ? "/game-options" : "/"}
          className="text-2xl font-black tracking-wider bg-linear-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent flex items-center gap-2 hover:opacity-90 transition"
        >
          <span>🦉</span>
          <span>KWIZZ</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link to={isLoggedIn ? "/game-options" : "/"} className="text-purple-200 hover:text-yellow-300 transition">
            Home
          </Link>
          
          <Link to="/player/join" className="text-purple-200 hover:text-yellow-300 transition">
            Join Quiz
          </Link>

          <Link to="/host/create" className="text-purple-200 hover:text-yellow-300 transition">
            Host Quiz
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-purple-900/60 border border-purple-500/40 text-purple-200 px-3 py-1 rounded-full font-bold">
                👤 {userNickname}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold px-3.5 py-1 rounded-full transition text-xs cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 text-purple-950 font-bold px-4 py-1.5 rounded-full hover:brightness-105 transition shadow-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl text-purple-300 hover:text-white transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-4 pb-4 pt-2 border-t border-purple-900/40 bg-[#160d38]">
          <Link
            to={isLoggedIn ? "/game-options" : "/"}
            onClick={() => setMenuOpen(false)}
            className="text-purple-200 hover:text-yellow-300 py-1"
          >
            Home
          </Link>
          
          <Link
            to="/player/join"
            onClick={() => setMenuOpen(false)}
            className="text-purple-200 hover:text-yellow-300 py-1"
          >
            Join Quiz
          </Link>

          <Link
            to="/host/create"
            onClick={() => setMenuOpen(false)}
            className="text-purple-200 hover:text-yellow-300 py-1"
          >
            Host Quiz
          </Link>

          {isLoggedIn ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="bg-red-500/20 border border-red-500/40 text-red-300 font-bold px-4 py-1.5 rounded-xl w-fit text-sm mt-1"
            >
              Logout ({userNickname})
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="bg-yellow-400 text-purple-900 font-semibold px-4 py-1.5 rounded-xl w-fit text-sm mt-1"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;