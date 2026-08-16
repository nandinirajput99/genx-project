import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addPlayer } from "../../redux/playersSlice";
import { setGame } from "../../redux/gameSlice";
import { db } from "../../firebase/firebase";
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
} from "firebase/firestore";

function JoinGame() {
    const [pin, setPin] = useState("");
    const [nickname, setNickname] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();

        setError("");

        if (pin.trim() === "" || nickname.trim() === "") {
            setError("Please enter Game PIN and Nickname");
            return;
        }

        try {
            setLoading(true);

            const gamePin = pin.trim();
            const playerName = nickname.trim();
            // Check game in Firebase
            const gameRef = doc(db, "games", gamePin);
            const gameSnap = await getDoc(gameRef);
            if (!gameSnap.exists()) {
                setError("Invalid Game PIN");
                return;
            }

            const gameData = gameSnap.data();

            // Create player
            const playerData = {
                id: "player_" + Date.now(),
                nickname: playerName,
                score: 0,
            };

            // Add player to Firebase
            await updateDoc(gameRef, {
                players: arrayUnion(playerData),
            });

            // Add player to Redux
            dispatch(addPlayer(playerData));
            dispatch(
                setGame({
                    gameId: gamePin,
                    pin: gamePin,
                    quizId: gameData.quizId || "",
                    status: gameData.status || "waiting",
                })
            );
            navigate("/player/lobby");

        } catch (error) {
            console.log("Join Game Error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
            {/* Background ambient lighting glows (Pure Purple / Indigo) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-380px bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-280px bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Floating 3D Question mark decorative tiles (Desktop) */}
            <div className="hidden lg:flex absolute left-12 top-1/4 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] -rotate-12 animate-pulse">
                ?
            </div>
            <div className="hidden lg:flex absolute right-12 top-1/3 w-14 h-14 bg-purple-900/40 border border-purple-500/40 rounded-2xl items-center justify-center text-purple-300 text-2xl font-black shadow-[0_0_20px_rgba(168,85,247,0.3)] rotate-12 animate-pulse">
                ?
            </div>

            {/* Language Selector Header Button (Top Right) */}
            <div className="w-full flex justify-end max-w-5xl z-20">
                <button
                    type="button"
                    className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3.5 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
                >
                    <span>🌐</span>
                    <span className="font-medium">English</span>
                    <span className="text-[10px]">▼</span>
                </button>
            </div>

            {/* Hero Logo Section */}
            <div className="relative flex flex-col items-center mt-1 sm:mt-3 z-10">
                {/* Floating Speech Bubbles */}
                <div className="absolute -left-28 sm:-left-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-purple-200 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
                    <span>Soch Badhao...</span>
                </div>
                <div className="absolute -right-28 sm:-right-36 top-1 bg-[#1b103e]/90 border border-purple-500/40 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-bounce hidden sm:flex items-center gap-1">
                    <span>👑 Bano Quiz Champion!</span>
                </div>

                {/* Mascot Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-b from-indigo-600 via-purple-800 to-purple-950 border-2 border-purple-400/70 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative mb-2 group hover:scale-105 transition-transform duration-300">
                    <span className="text-4xl sm:text-5xl drop-shadow-md">🦉</span>
                    <span className="absolute -top-2 -right-1 text-xl animate-pulse">💡</span>
                    <span className="absolute -top-3 -left-1 text-lg">🎓</span>
                </div>

                {/* 3D Game Logo Text */}
                <div className="text-center">
                    <h1
                        className="text-3xl sm:text-5xl font-black tracking-wider uppercase bg-linear-to-b from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(234,179,8,0.5)]"
                        style={{
                            textShadow: "0 2px 0 #b45309, 0 4px 0 #78350f, 0 6px 12px rgba(0,0,0,0.8)",
                        }}
                    >
                        Kuuizz
                    </h1>
                    <div className="text-lg sm:text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] -mt-1 sm:mt-0">
                        GAME QUIZ
                    </div>
                </div>

                {/* Subtitle Divider Line */}
                <div className="flex items-center justify-center space-x-3 text-purple-300/80 text-xs sm:text-sm font-semibold tracking-widest mt-2">
                    <span className="w-8 sm:w-12 h-2px bg-linear-to-r from-transparent to-purple-400/60"></span>
                    <span>Play · Think · Win</span>
                    <span className="w-8 sm:w-12 h-2px bg-linear-to-l from-transparent to-purple-400/60"></span>
                </div>
            </div>

            {/* Main Content Area with Side Badges & Central Card */}
            <div className="w-full max-w-4xl flex items-center justify-center relative my-6 sm:my-8 z-10">

                {/* Left Side Floating Feature Badges (Desktop/Tablet) */}
                <div className="hidden md:flex flex-col space-y-4 absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <div className="bg-[#191038]/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg flex items-center space-x-2.5 text-xs font-bold text-purple-200 hover:border-purple-400 transition transform hover:-translate-x-1">
                        <span className="text-base">🎮</span>
                        <span>Live Quizzes</span>
                    </div>
                    <div className="bg-[#191038]/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg flex items-center space-x-2.5 text-xs font-bold text-amber-300 hover:border-purple-400 transition transform hover:-translate-x-1">
                        <span className="text-base">🎁</span>
                        <span>Win Rewards</span>
                    </div>
                </div>

                {/* Right Side Floating Feature Badges (Desktop/Tablet) */}
                <div className="hidden md:flex flex-col space-y-4 absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <div className="bg-[#191038]/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg flex items-center space-x-2.5 text-xs font-bold text-purple-200 hover:border-purple-400 transition transform hover:translate-x-1">
                        <span className="text-base">🧠</span>
                        <span>Upgrade Your Brain</span>
                    </div>
                    <div className="bg-[#191038]/80 border border-purple-500/30 px-3.5 py-2.5 rounded-2xl backdrop-blur-md shadow-lg flex items-center space-x-2.5 text-xs font-bold text-cyan-300 hover:border-purple-400 transition transform hover:translate-x-1">
                        <span className="text-base">📊</span>
                        <span>Climb Leaderboard</span>
                    </div>
                </div>

                {/* Central Join Form Card */}
                <div className="w-full max-w-md relative">

                    {/* Top Golden Trophy Badge Emblem */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-linear-to-b from-amber-300 via-yellow-500 to-amber-600 border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-2xl sm:text-3xl relative group">
                            🏆
                        </div>
                    </div>

                    {/* Glassmorphism Card Container */}
                    <div className="bg-[#120a2e]/90 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative z-10 pt-10">

                        {/* Heading */}
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-white tracking-wide">
                            Welcome <span className="text-purple-400">Back!</span>
                        </h2>
                        <p className="text-center text-purple-200/60 text-xs sm:text-sm mt-1 mb-6 font-medium">
                            Join to continue your Kuuizz journey 🚀
                        </p>

                        <form onSubmit={handleJoin} className="space-y-4">

                            {/* Game PIN */}
                            <div>
                                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                                    Game PIN
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-purple-400 text-lg">🔑</span>
                                    <input
                                        type="text"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="Enter Game PIN"
                                        className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-base sm:text-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Nickname */}
                            <div>
                                <label className="block text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
                                    Nickname
                                </label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-purple-400 text-lg">👤</span>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        placeholder="Enter your nickname"
                                        className="w-full bg-[#1b113e] border border-purple-800/60 focus:border-purple-400 text-white placeholder-purple-400/40 rounded-xl pl-11 pr-4 py-3.5 outline-none font-semibold text-base sm:text-lg transition-all duration-200 focus:ring-2 focus:ring-purple-500/40 shadow-inner"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/60 text-red-300 text-xs sm:text-sm py-2.5 px-4 rounded-xl text-center font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Join Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>⚡</span>
                                <span>{loading ? "Joining..." : "Join Game"}</span>
                                <span className="text-xl">➔</span>
                            </button>

                        </form>

                    </div>
                </div>

            </div>
        </div>
    );
}

export default JoinGame;