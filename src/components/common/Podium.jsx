import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// Confetti Particle Canvas Component
const ConfettiCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animationFrameId;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ["#FFD700", "#FFC0CB", "#00FFFF", "#FF4500", "#32CD32", "#FF00FF"];
        const particles = Array.from({ length: 140 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0,
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, idx) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

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

function Podium({ winners = [], totalCorrect, totalWrong }) {
    const displayPlayers = winners.length > 0 ? winners : [
        { nickname: "Champion Tom 👑", score: 5950 },
        { nickname: "Smart Ansh", score: 1600 },
        { nickname: "Player trtr", score: 0 },
    ];

    const first = displayPlayers[0];
    const second = displayPlayers[1];
    const third = displayPlayers[2];

    // Joyful Fanfare and Clapping sound with Web Audio API
    const playPodiumCelebration = () => {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;

            // 1. Joyful Fanfare Melody (Brass-style arpeggio & chords)
            const notes = [
                { freq: 261.63, start: 0.0, dur: 0.25, type: "triangle" }, // C4
                { freq: 329.63, start: 0.18, dur: 0.25, type: "triangle" }, // E4
                { freq: 392.00, start: 0.36, dur: 0.25, type: "triangle" }, // G4
                { freq: 523.25, start: 0.54, dur: 0.6, type: "sine" },     // C5
                { freq: 392.00, start: 1.0, dur: 0.2, type: "triangle" },   // G4
                { freq: 523.25, start: 1.2, dur: 0.8, type: "sine" },       // C5 triumphant
                { freq: 659.25, start: 1.2, dur: 0.8, type: "sine" },       // E5 harmony
            ];

            notes.forEach(({ freq, start, dur, type }) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + start);
                gain.gain.setValueAtTime(0, now + start);
                gain.gain.linearRampToValueAtTime(0.2, now + start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + start);
                osc.stop(now + start + dur);
            });

            // 2. Realistic Clapping / Applause sound (gentle noise bursts)
            for (let i = 0; i < 40; i++) {
                const clapTime = now + 0.2 + Math.random() * 2.8;
                const bufferSize = Math.floor(ctx.sampleRate * 0.04);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = Math.random() * 2 - 1;
                }
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = "bandpass";
                filter.frequency.value = 900 + Math.random() * 900;
                filter.Q.value = 2.0;

                const clapGain = ctx.createGain();
                clapGain.gain.setValueAtTime(0.1, clapTime);
                clapGain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.04);

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

    // Overall correct and wrong answers calculation
    const correctCount =
        totalCorrect !== undefined
            ? totalCorrect
            : winners.reduce(
                (acc, player) =>
                    acc + (player.correctCount ?? (player.correct ? 1 : 0)),
                0
            );

    const wrongCount =
        totalWrong !== undefined
            ? totalWrong
            : winners.reduce(
                (acc, player) =>
                    acc +
                    (player.wrongCount ??
                        (player.answered === true && player.correct === false ? 1 : 0)),
                0
            );

    const totalAnswers = correctCount + wrongCount;
    const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

    return (
        <div className="min-h-screen bg-linear-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-x-hidden">

            {/* Falling Confetti Canvas */}
            <ConfettiCanvas />

            {/* Main Results Container (Matching Final Podium & Treats) */}
            <div className="max-w-3xl w-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 text-center relative z-10 animate-fade-in my-6">

                {/* Top Celebration Bar */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                    <div className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-yellow-300 animate-bounce">
                        <span>🎉</span>
                        <span>🥳</span>
                        <span>Congratulations!</span>
                        <span>👏</span>
                    </div>

                    <button
                        onClick={playPodiumCelebration}
                        className="bg-yellow-500 hover:bg-yellow-400 text-indigo-950 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                        <span>🔊</span>
                        <span>Sound of Joy</span>
                    </button>
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-4xl font-black bg-linear-to-r from-yellow-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-md mb-8">
                    🏆 FINAL RESULTS  🏆
                </h2>

                {/* 1. Winner Card (Special Royal Treat) */}
                {first && (
                    <div className="bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-600 p-1 rounded-3xl shadow-[0_0_35px_rgba(234,179,8,0.5)] mb-8 transform hover:scale-[1.02] transition duration-300">
                        <div className="bg-indigo-950 rounded-[22px] p-6 text-center">
                            <span className="text-6xl block mb-2">👑</span>
                            <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-xs mb-1">
                                Ultimate Champion - 1st Place
                            </p>
                            <h3 className="text-3xl sm:text-4xl font-black text-white mb-2">
                                {first.nickname || first.name}
                            </h3>
                            <p className="text-2xl font-black text-yellow-300">
                                {first.score || 0} Points
                            </p>

                            {/* Winner's Treat description */}
                            <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                                <p className="text-xs sm:text-sm text-yellow-200 font-medium">
                                    🎁 <span className="underline font-bold">Royal Winner Treat</span>: You get the legendary Gold Crown, unlimited bragging rights, and a digital box of royal chocolates! 👑🍫✨
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Visual Olympic Podium Steps (2nd, 1st, 3rd) */}
                <div className="flex items-end justify-center gap-3 sm:gap-6 mb-8 pt-4">

                    {/* 2nd Place Step */}
                    {second && (
                        <div className="flex flex-col items-center">
                            <span className="bg-gray-200 text-purple-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full mb-1 shadow-md">
                                2nd Place 🥈
                            </span>
                            <div className="text-sm sm:text-base font-semibold mb-1 truncate max-w-[90px] sm:max-w-none">
                                {second.nickname || second.name}
                            </div>
                            <div className="text-xs font-bold text-yellow-300 mb-2">
                                {second.score || 0} pts
                            </div>
                            <div className="bg-gray-300 text-purple-900 w-22 sm:w-28 h-28 sm:h-32 rounded-t-xl flex items-start justify-center pt-2 font-bold text-2xl shadow-lg border-t-2 border-white/50">
                                🥈
                            </div>
                        </div>
                    )}

                    {/* 1st Place Step */}
                    {first && (
                        <div className="flex flex-col items-center">
                            <span className="bg-yellow-400 text-purple-950 font-black text-xs px-3 py-1 rounded-full mb-1 shadow-lg animate-pulse">
                                👑 1st Place 🥇
                            </span>
                            <div className="text-base sm:text-lg font-bold mb-1 truncate max-w-[100px] sm:max-w-none">
                                {first.nickname || first.name}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-yellow-300 mb-2">
                                {first.score || 0} pts
                            </div>
                            <div className="bg-yellow-400 text-purple-900 w-26 sm:w-32 h-38 sm:h-44 rounded-t-xl flex items-start justify-center pt-2 font-bold text-3xl shadow-xl border-t-2 border-yellow-200">
                                🥇
                            </div>
                        </div>
                    )}

                    {/* 3rd Place Step */}
                    {third && (
                        <div className="flex flex-col items-center">
                            <span className="bg-orange-400 text-purple-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full mb-1 shadow-md">
                                3rd Place 🥉
                            </span>
                            <div className="text-sm sm:text-base font-semibold mb-1 truncate max-w-[90px] sm:max-w-none">
                                {third.nickname || third.name}
                            </div>
                            <div className="text-xs font-bold text-yellow-300 mb-2">
                                {third.score || 0} pts
                            </div>
                            <div className="bg-orange-400 text-purple-900 w-22 sm:w-28 h-20 sm:h-24 rounded-t-xl flex items-start justify-center pt-2 font-bold text-2xl shadow-lg border-t-2 border-white/40">
                                🥉
                            </div>
                        </div>
                    )}

                </div>

                {/* 3. Leaderboard Rankings & Rewards (Treats for all players!) */}
                <div className="bg-black/30 rounded-2xl p-4 sm:p-6 mb-8 max-h-[300px] overflow-y-auto border border-white/10 text-left custom-scrollbar">
                    <h4 className="text-base sm:text-lg font-bold text-gray-200 mb-4 border-b border-white/10 pb-2 flex items-center justify-between">
                        <span>Leaderboard Rankings & Treats 🎁</span>
                        <span className="text-xs text-purple-300 font-normal">Ranked by score</span>
                    </h4>

                    <div className="space-y-3">
                        {displayPlayers.map((player, idx) => {
                            let badge = `${idx + 1}th`;
                            let badgeStyle = "bg-white/10 text-white";
                            let treat = "Chocolate Coin 🪙";

                            if (idx === 0) {
                                badge = "🥇 1st";
                                badgeStyle = "bg-yellow-500 text-indigo-950 font-bold";
                                treat = "Royal Gold Crown & Box of Chocolates 👑🍫";
                            } else if (idx === 1) {
                                badge = "🥈 2nd";
                                badgeStyle = "bg-slate-300 text-slate-900 font-bold";
                                treat = "Silver Medal & Pack of Gummy Bears 🥈🍬";
                            } else if (idx === 2) {
                                badge = "🥉 3rd";
                                badgeStyle = "bg-amber-600 text-white font-bold";
                                treat = "Bronze Medal & Sweet Lollipop 🥉🍭";
                            } else {
                                treat = "Good Game Badge & Chocolate Coin 🪙🍫";
                            }

                            return (
                                <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/5 gap-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${badgeStyle}`}>
                                            {badge}
                                        </span>
                                        <span className="font-extrabold text-white text-base sm:text-lg">
                                            {player.nickname || player.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3">
                                        <span className="font-black text-indigo-300 text-sm sm:text-base">
                                            {player.score || 0} pts
                                        </span>
                                        <span className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                                            🎁 {treat}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Quiz Answer Performance & Statistics Section */}
                <div className="flex flex-col items-center mt-6 text-center w-full">

                    <div className="flex items-center gap-2 bg-[#120a2e]/90 border border-purple-400/40 text-purple-200 text-xs sm:text-sm px-4 py-2 rounded-full shadow-lg mb-3 backdrop-blur-md">
                        <span className="text-base">📊</span>
                        <span className="font-bold text-white tracking-wide">Overall Quiz Performance</span>
                        <span className="text-[11px] text-purple-300">({displayPlayers.length} Players)</span>
                    </div>

                    <p className="text-xs text-purple-200/80 mb-4 max-w-xs leading-relaxed font-medium">
                        Total answers submitted across all quiz rounds by all players:
                    </p>

                    <div className="flex justify-center gap-4 sm:gap-6 w-full max-w-md">

                        {/* Correct Answers Box (Green) */}
                        <div className="flex-1 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl p-4 sm:p-5 text-center shadow-[0_0_25px_rgba(52,211,153,0.3)] backdrop-blur-md">
                            <div className="text-3xl sm:text-4xl mb-1">✅</div>
                            <div className="text-xs sm:text-sm font-bold text-emerald-200 uppercase tracking-wider">
                                Correct Answers
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-emerald-300 my-1">
                                {correctCount}
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-300/80 bg-emerald-950/60 rounded-lg py-1 px-2 mt-1">
                                Right Answers Given
                            </div>
                        </div>

                        {/* Wrong Answers Box (Red) */}
                        <div className="flex-1 bg-rose-500/20 border-2 border-rose-400 rounded-2xl p-4 sm:p-5 text-center shadow-[0_0_25px_rgba(244,63,94,0.3)] backdrop-blur-md">
                            <div className="text-3xl sm:text-4xl mb-1">❌</div>
                            <div className="text-xs sm:text-sm font-bold text-rose-200 uppercase tracking-wider">
                                Wrong Answers
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-rose-300 my-1">
                                {wrongCount}
                            </div>
                            <div className="text-[11px] font-semibold text-rose-300/80 bg-rose-950/60 rounded-lg py-1 px-2 mt-1">
                                Mistakes / Missed
                            </div>
                        </div>

                    </div>

                    {totalAnswers > 0 && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 bg-[#1b103e]/80 border border-purple-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-purple-200 shadow-sm">
                            <span>🎯</span>
                            <span>Overall Accuracy:</span>
                            <span className="font-extrabold text-amber-300">
                                {accuracy}%
                            </span>
                            <span className="text-purple-300/80 text-[11px]">
                                ({correctCount} of {totalAnswers} total answers correct)
                            </span>
                        </div>
                    )}

                </div>

                {/* 5. Navigation Home / Play Again Button */}
                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        to="/game-options"
                        className="bg-linear-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-900/40 transition duration-200 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5"
                    >
                        Play Another Game 🚀
                    </Link>
                </div>

            </div>

        </div>
    );
}

export default Podium;