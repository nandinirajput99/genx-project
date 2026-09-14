import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Confetti Particle Canvas Component (Soft, festive celebratory confetti)
const ConfettiCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Attractive, soothing, festive color palette (warm gold, soft emerald, coral, sky blue, lilac)
        const colors = ["#fbbf24", "#38bdf8", "#34d399", "#f43f5e", "#c084fc", "#f59e0b"];
        const particles = Array.from({ length: 90 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 5 + 3,
            d: Math.random() * canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.05 + 0.02,
            tiltAngle: 0,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, idx) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 2.5 + p.r / 2) / 2;
                p.tilt = Math.sin(p.tiltAngle - idx / 3) * 12;

                if (p.y > canvas.height) {
                    p.x = Math.random() * canvas.width;
                    p.y = -20;
                    p.tilt = Math.random() * 10 - 5;
                }

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-50" />;
};

function Podium({ winners = [] }) {
    const displayPlayers = winners && winners.length > 0 ? winners : [];

    const first = displayPlayers[0];
    const second = displayPlayers[1];
    const third = displayPlayers[2];

    const topScore = first?.score > 0 ? first.score : 1;

    // Joyful Kahoot-style Fanfare with Web Audio API
    const playPodiumCelebration = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;

            // 1. Triumphant Fanfare Melody (Bright, joyful, rich brass arpeggio)
            const notes = [
                { freq: 261.63, start: 0.0, dur: 0.22, type: "triangle" }, // C4
                { freq: 329.63, start: 0.16, dur: 0.22, type: "triangle" }, // E4
                { freq: 392.00, start: 0.32, dur: 0.22, type: "triangle" }, // G4
                { freq: 523.25, start: 0.48, dur: 0.55, type: "sine" },     // C5
                { freq: 392.00, start: 0.95, dur: 0.18, type: "triangle" }, // G4
                { freq: 523.25, start: 1.15, dur: 0.75, type: "sine" },     // C5 triumphant
                { freq: 659.25, start: 1.15, dur: 0.75, type: "sine" },     // E5 harmony
            ];

            notes.forEach(({ freq, start, dur, type }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + start);
                gain.gain.setValueAtTime(0, now + start);
                gain.gain.linearRampToValueAtTime(0.18, now + start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + start);
                osc.stop(now + start + dur);
            });

            // 2. Realistic Clapping / Applause sound (gentle celebratory noise bursts)
            for (let i = 0; i < 30; i++) {
                const clapTime = now + 0.2 + Math.random() * 2.2;
                const bufferSize = Math.floor(ctx.sampleRate * 0.035);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = Math.random() * 2 - 1;
                }
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = "bandpass";
                filter.frequency.value = 850 + Math.random() * 800;
                filter.Q.value = 2.0;

                const clapGain = ctx.createGain();
                clapGain.gain.setValueAtTime(0.08, clapTime);
                clapGain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.035);

                noiseSource.connect(filter);
                filter.connect(clapGain);
                clapGain.connect(ctx.destination);

                noiseSource.start(clapTime);
            }
        } catch (err) {
            console.log("Audio celebration error:", err);
        }
    };

    useEffect(() => {
        playPodiumCelebration();
    }, []);

    const avatars = ["👑", "⭐", "🚀", "🔥", "🎯", "⚡", "🦉", "🎮"];

    // Empty state: No players participated
    if (displayPlayers.length === 0) {
        return (
            <div className="min-h-screen bg-[#0d0926] text-white flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="max-w-md w-full bg-[#18123c]/90 backdrop-blur-xl border border-purple-500/30 shadow-2xl rounded-3xl p-8">
                    <span className="text-5xl block mb-3">🎮</span>
                    <h2 className="text-2xl font-black mb-2 text-white">Quiz Session Ended</h2>
                    <p className="text-purple-300 text-sm mb-6">
                        No players participated in this round.
                    </p>
                    <Link
                        to="/host/create"
                        className="inline-block bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-6 py-3 rounded-2xl shadow-lg hover:brightness-110 transition"
                    >
                        Host A New Quiz 🚀
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#1a1440] to-[#0c0824] text-white flex flex-col items-center justify-between p-4 sm:p-6 select-none relative overflow-x-hidden">
            {/* Confetti celebration canvas */}
            <ConfettiCanvas />

            {/* Ambient Lighting Background Accents (Gentle, non-intrusive glow) */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-3xl h-60 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Top Bar with celebration title and audio button */}
            <header className="w-full max-w-4xl flex items-center justify-between z-10 pt-2 pb-4">
                <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏆</span>
                    <div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                            KWIZZ Quiz Battle
                        </span>
                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                            Final Podium & Results
                        </h1>
                    </div>
                </div>

                <button
                    onClick={playPodiumCelebration}
                    className="flex items-center gap-2 bg-[#211951]/80 hover:bg-[#2e236b] text-amber-300 border border-amber-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-lg cursor-pointer"
                    title="Play Celebration Sound"
                >
                    <span>🔊</span>
                    <span className="hidden sm:inline">Replay Sound</span>
                </button>
            </header>

            {/* Main Content Area: 3D Olympic Podium Pedestals */}
            <main className="w-full max-w-4xl z-10 my-auto flex flex-col items-center">
                
                {/* 1st Place Highlight Card (Celebration of champion) */}
                {first && (
                    <div className="w-full max-w-lg mb-8 text-center relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-[#17113a]/95 border border-amber-400/40 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
                            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                <span>👑</span> 1st Place Champion
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
                                {first.nickname || first.name}
                            </h2>
                            <p className="text-lg sm:text-xl font-extrabold text-amber-300">
                                {first.score?.toLocaleString() || 0} pts
                            </p>
                        </div>
                    </div>
                )}

                {/* Stepped 3D Olympic Podium (Kahoot Style: 2nd on left, 1st center, 3rd right) */}
                <div className="w-full max-w-2xl flex items-end justify-center gap-2 sm:gap-4 px-2 pb-2">

                    {/* 2nd Place Pedestal (Silver) */}
                    {second ? (
                        <div className="flex-1 max-w-[170px] flex flex-col items-center">
                            {/* Player Info Above Pillar */}
                            <div className="flex flex-col items-center mb-2 animate-bounce" style={{ animationDuration: "2.8s" }}>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1f1947] border-2 border-slate-300 flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_15px_rgba(203,213,225,0.4)]">
                                    🥈
                                </div>
                                <span className="text-xs sm:text-sm font-black text-white mt-1.5 truncate max-w-[100px] sm:max-w-[130px] text-center">
                                    {second.nickname || second.name}
                                </span>
                                <span className="text-[11px] font-extrabold text-slate-300 bg-slate-800/80 border border-slate-400/30 px-2 py-0.5 rounded-full mt-0.5">
                                    {second.score?.toLocaleString() || 0} pts
                                </span>
                            </div>

                            {/* 2nd Pillar */}
                            <div className="w-full h-32 sm:h-40 bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t-2 border-slate-300/80 border-x border-slate-400/40">
                                <span className="text-3xl sm:text-4xl font-black text-slate-100 drop-shadow-md">
                                    2
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 mt-1">
                                    SILVER
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 max-w-[170px]" />
                    )}

                    {/* 1st Place Pedestal (Gold - Tallest, center) */}
                    {first && (
                        <div className="flex-1 max-w-[200px] flex flex-col items-center z-10">
                            {/* Player Info Above Pillar */}
                            <div className="flex flex-col items-center mb-2 animate-bounce" style={{ animationDuration: "2.2s" }}>
                                <div className="relative">
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl filter drop-shadow">
                                        👑
                                    </span>
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#24194f] border-2 border-amber-300 flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_25px_rgba(251,191,36,0.6)]">
                                        🥇
                                    </div>
                                </div>
                                <span className="text-sm sm:text-base font-black text-amber-200 mt-1.5 truncate max-w-[120px] sm:max-w-[150px] text-center">
                                    {first.nickname || first.name}
                                </span>
                                <span className="text-xs font-black text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-0.5 rounded-full mt-0.5 shadow-sm">
                                    {first.score?.toLocaleString() || 0} pts
                                </span>
                            </div>

                            {/* 1st Pillar (Tallest) */}
                            <div className="w-full h-44 sm:h-56 bg-gradient-to-b from-amber-400 via-amber-600 to-yellow-800 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[0_15px_35px_rgba(245,158,11,0.35)] border-t-2 border-yellow-200 border-x border-amber-300/60">
                                <span className="text-4xl sm:text-5xl font-black text-yellow-100 drop-shadow-md">
                                    1
                                </span>
                                <span className="text-[11px] font-black uppercase tracking-wider text-yellow-200 mt-1">
                                    CHAMPION
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place Pedestal (Bronze) */}
                    {third ? (
                        <div className="flex-1 max-w-[170px] flex flex-col items-center">
                            {/* Player Info Above Pillar */}
                            <div className="flex flex-col items-center mb-2 animate-bounce" style={{ animationDuration: "3.2s" }}>
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1f1947] border-2 border-amber-600 flex items-center justify-center text-xl sm:text-2xl shadow-[0_0_15px_rgba(217,119,6,0.4)]">
                                    🥉
                                </div>
                                <span className="text-xs sm:text-sm font-black text-white mt-1.5 truncate max-w-[100px] sm:max-w-[130px] text-center">
                                    {third.nickname || third.name}
                                </span>
                                <span className="text-[11px] font-extrabold text-amber-300 bg-amber-950/80 border border-amber-600/30 px-2 py-0.5 rounded-full mt-0.5">
                                    {third.score?.toLocaleString() || 0} pts
                                </span>
                            </div>

                            {/* 3rd Pillar */}
                            <div className="w-full h-24 sm:h-32 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t-2 border-amber-500/80 border-x border-amber-700/40">
                                <span className="text-3xl sm:text-4xl font-black text-amber-100 drop-shadow-md">
                                    3
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mt-1">
                                    BRONZE
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 max-w-[170px]" />
                    )}

                </div>

                {/* Kahoot-style Leaderboard Standings Table (Smooth, modern, non-jarring) */}
                <div className="w-full max-w-2xl bg-[#150e38]/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl mt-6">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📊</span>
                            <span className="font-extrabold text-sm sm:text-base text-white">
                                Final Standings
                            </span>
                            <span className="text-xs text-purple-300 font-semibold">
                                ({displayPlayers.length} player{displayPlayers.length > 1 ? "s" : ""})
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                            Ranked by Points
                        </span>
                    </div>

                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                        {displayPlayers.map((player, idx) => {
                            const rank = idx + 1;
                            const isTop1 = rank === 1;
                            const isTop2 = rank === 2;
                            const isTop3 = rank === 3;

                            const avatar = avatars[idx % avatars.length];
                            const playerScore = player.score || 0;
                            const relativePercent = Math.max(10, Math.min(100, Math.round((playerScore / topScore) * 100)));

                            let rankBadgeClass = "bg-purple-900/60 border border-purple-400/30 text-purple-200";
                            let titleBadge = "⚡ Challenger";

                            if (isTop1) {
                                rankBadgeClass = "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md";
                                titleBadge = "👑 Champion";
                            } else if (isTop2) {
                                rankBadgeClass = "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 font-black shadow-md";
                                titleBadge = "🥈 2nd Place";
                            } else if (isTop3) {
                                rankBadgeClass = "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black shadow-md";
                                titleBadge = "🥉 3rd Place";
                            }

                            return (
                                <div
                                    key={player.id || idx}
                                    className={`flex flex-col p-3 rounded-2xl border transition-all duration-200 ${
                                        isTop1
                                            ? "bg-[#251854]/80 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                                            : "bg-[#1c1344]/60 border-purple-500/20 hover:bg-[#231854]/60"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {/* Rank Badge */}
                                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${rankBadgeClass}`}>
                                                #{rank}
                                            </span>

                                            {/* Avatar */}
                                            <span className="text-xl shrink-0">{avatar}</span>

                                            {/* Name & Title */}
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-extrabold text-sm sm:text-base text-white truncate max-w-[140px] sm:max-w-[200px]">
                                                        {player.nickname || player.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300">
                                                        {titleBadge}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score Pill */}
                                        <div className="shrink-0 text-right">
                                            <span className="text-sm sm:text-base font-black text-amber-300">
                                                {playerScore.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-semibold text-purple-300 ml-1">
                                                pts
                                            </span>
                                        </div>
                                    </div>

                                    {/* Relative score progress bar (Kahoot style) */}
                                    <div className="w-full bg-[#0d0926]/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                isTop1
                                                    ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                                                    : isTop2
                                                    ? "bg-gradient-to-r from-slate-300 to-slate-400"
                                                    : isTop3
                                                    ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                                    : "bg-gradient-to-r from-purple-500 to-indigo-400"
                                            }`}
                                            style={{ width: `${relativePercent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* Bottom Navigation Buttons */}
            <footer className="w-full max-w-md z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 pb-2">
                <Link
                    to="/game-options"
                    className="w-full sm:w-auto flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-purple-900/40 text-center text-sm sm:text-base transition transform active:scale-95 cursor-pointer border border-purple-400/30"
                >
                    🎮 Play Another Game
                </Link>
                <Link
                    to="/host/create"
                    className="w-full sm:w-auto flex-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-yellow-500/20 text-center text-sm sm:text-base transition transform active:scale-95 cursor-pointer"
                >
                    👑 Host New Quiz
                </Link>
            </footer>
        </div>
    );
}

export default Podium;