import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

// Helper for human-readable Firebase Auth error messages
const getFriendlyErrorMessage = (error) => {
  if (!error) return "An error occurred.";
  const code = error.code || "";

  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email or username.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email/username or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return error.message || "Failed to login. Please try again.";
  }
};

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("userLoggedIn") === "true") {
      navigate("/game-options");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrUsername.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      let emailToUse = emailOrUsername.trim();

      // If user typed a nickname instead of email, find corresponding email in Firestore
      if (!emailToUse.includes("@")) {
        const q = query(
          collection(db, "users"),
          where("nickname", "==", emailToUse)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          emailToUse = querySnapshot.docs[0].data().email;
        }
      }

      // 1. Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailToUse,
        password
      );
      const loggedUser = userCredential.user;

      // 2. Fetch user's role from Firestore users collection
      const userDocRef = doc(db, "users", loggedUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let savedRole = "";
      if (userDocSnap.exists()) {
        savedRole = userDocSnap.data().role || "";
      }

      // 3. Redirect user based on their saved role
      if (savedRole === "Host") {
        navigate("/host/create");
      } else if (savedRole === "Player") {
        navigate("/player/join");
      } else {
        navigate("/game-options");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-95 bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-70 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Floating 3D Question mark decorative tiles (Desktop) */}
      <div className="hidden lg:flex absolute left-12 top-1/4 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] -rotate-12 animate-pulse">
        ?
      </div>
      <div className="hidden lg:flex absolute right-12 top-1/3 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-12 animate-pulse">
        ?
      </div>

      {/* Hero Logo Section */}
      <div className="relative flex flex-col items-center mt-2 z-10">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-2 group hover:scale-105 transition-transform duration-300">
          <span className="text-4xl sm:text-5xl drop-shadow-md">🦉</span>
          <span className="absolute -top-2 -right-1 text-xl animate-pulse">💡</span>
          <span className="absolute -top-3 -left-1 text-lg">🎓</span>
        </div>

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

      {/* Central Login Card */}
      <div className="w-full max-w-md my-6 relative z-10">
        <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative">
          
          <div className="flex bg-[#1b113e] p-1 rounded-2xl mb-6 border border-purple-800/60">
            <button
              type="button"
              className="w-1/2 py-2.5 rounded-xl font-extrabold text-sm bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 shadow-md"
            >
              Login
            </button>
            <Link
              to="/signup"
              className="w-1/2 py-2.5 rounded-xl font-bold text-sm text-purple-300 text-center hover:text-white transition"
            >
              Sign Up
            </Link>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white tracking-wide">
            Welcome <span className="text-purple-400">Back!</span>
          </h2>
          <p className="text-center text-purple-200/60 text-xs sm:text-sm mt-1 mb-6 font-medium">
            Login to enter Quiz Arena 🚀
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-purple-400 text-lg">👤</span>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter email or username"
                  className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                />
              </div>
            </div>

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
                  placeholder="Enter password"
                  className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/60 text-red-300 text-xs py-2.5 px-4 rounded-xl text-center font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"></span>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Login to Quiz Arena</span>
                  <span className="text-xl">➔</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-purple-300/70 mt-6">
            New here?{" "}
            <Link to="/signup" className="text-amber-300 font-bold hover:underline">
              Create Account ➔
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
