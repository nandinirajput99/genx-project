import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function SignUp() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userNickname", nickname);
    localStorage.setItem("userEmail", email);
    navigate("/game-options");
  };

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-380px bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-280px bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Hero Logo Section */}
      <div className="relative flex flex-col items-center mt-2 z-10">
        {/* Mascot Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-2 group hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl drop-shadow-md">🦉</span>
          <span className="absolute -top-2 -right-1 text-xl animate-pulse">👑</span>
          <span className="absolute -top-3 -left-1 text-lg">🎓</span>
        </div>

        {/* Project Title & Subtitle */}
        <div className="text-center">
          <h1
            className="text-3xl sm:text-5xl font-black tracking-wider uppercase bg-linear-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]"
            style={{
              textShadow: "0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.8)",
            }}
          >
            KWIZZ
          </h1>
          <p className="text-purple-200/80 text-xs sm:text-sm font-semibold tracking-wide mt-2">
            Challenge your friends and test your knowledge!
          </p>
        </div>
      </div>

      {/* Central SignUp Card */}
      <div className="w-full max-w-md my-6 relative z-10">
        {/* Glassmorphism Card Container */}
        <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative">
          
          {/* Tab Selection */}
          <div className="flex bg-[#1b113e] p-1 rounded-2xl mb-6 border border-purple-800/60">
            <Link
              to="/login"
              className="w-1/2 py-2.5 rounded-xl font-bold text-sm text-purple-300 text-center hover:text-white transition"
            >
              Login
            </Link>
            <button
              type="button"
              className="w-1/2 py-2.5 rounded-xl font-extrabold text-sm bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 shadow-md"
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white tracking-wide">
            Join The <span className="text-purple-400">Battle!</span>
          </h2>
          <p className="text-center text-purple-200/60 text-xs sm:text-sm mt-1 mb-6 font-medium">
            Create an account to start playing 🚀
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Nickname */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Nickname / Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-purple-400 text-lg">👤</span>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Choose your nickname"
                  className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-purple-400 text-lg">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-purple-400 text-lg">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/60 text-red-300 text-xs py-2.5 px-4 rounded-xl text-center font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer"
            >
              <span>⚡</span>
              <span>Create Free Account</span>
              <span className="text-xl">➔</span>
            </button>
          </form>

          <p className="text-center text-xs text-purple-300/70 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-300 font-bold hover:underline">
              Log In ➔
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
