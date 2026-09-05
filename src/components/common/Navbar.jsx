import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetGame } from "../../redux/gameSlice";
import { clearPlayers } from "../../redux/playersSlice";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = localStorage.getItem("userLoggedIn") === "true";
  const userNickname =
    localStorage.getItem("userNickname") ||
    localStorage.getItem("userEmail")?.split("@")[0] ||
    "Player";

  const handleLogout = () => {
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userNickname");
    localStorage.removeItem("gamePin");
    localStorage.removeItem("currentPlayerId");
    localStorage.removeItem("currentPlayerNickname");
    localStorage.removeItem("hostPin");
    dispatch(resetGame());
    dispatch(clearPlayers());
    setMenuOpen(false);
    navigate("/login");
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="bg-[#120a2e]/95 border-b border-purple-800/60 text-white shadow-xl backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to={isLoggedIn ? "/game-options" : "/"}
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-full bg-linear-to-b from-indigo-600 to-purple-800 border border-purple-400/60 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
            🦉
          </div>
          <span className="text-2xl font-black tracking-wider uppercase bg-linear-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
            KWIZZ
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to={isLoggedIn ? "/game-options" : "/login"}
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 transition"
          >
            Dashboard
          </Link>

          <Link
            to="/player/join"
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 transition"
          >
            Join Quiz
          </Link>

          <Link
            to="/host/create"
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 transition"
          >
            Host Quiz
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-purple-900/60 border border-purple-500/40 text-purple-200 px-3 py-1 rounded-full font-bold">
                👤 {userNickname}
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition shadow-md cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="bg-yellow-400 text-purple-950 font-bold px-4 py-1.5 rounded-full hover:bg-yellow-300 text-xs sm:text-sm transition shadow-md"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-purple-800/80 border border-purple-500/50 hover:bg-purple-700 text-white font-bold px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl text-purple-300 hover:text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-3 px-5 pb-5 pt-2 border-t border-purple-800/40 bg-[#160d38]">
          <Link
            to={isLoggedIn ? "/game-options" : "/login"}
            onClick={handleLinkClick}
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 py-1"
          >
            Dashboard
          </Link>

          <Link
            to="/player/join"
            onClick={handleLinkClick}
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 py-1"
          >
            Join Quiz
          </Link>

          <Link
            to="/host/create"
            onClick={handleLinkClick}
            className="text-sm font-semibold text-purple-200 hover:text-amber-300 py-1"
          >
            Host Quiz
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center justify-between pt-2 border-t border-purple-800/40">
              <span className="text-xs text-purple-300 font-semibold">
                Logged in as <strong>{userNickname}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="bg-yellow-400 text-purple-950 font-bold px-4 py-1.5 rounded-full hover:bg-yellow-300 text-xs text-center flex-1"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={handleLinkClick}
                className="bg-purple-800 border border-purple-500/50 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-full text-xs text-center flex-1"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;