import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Podium from "../common/Podium";

function GameScreen() {
    const navigate = useNavigate();

    const game = useSelector((state) => state.game);
    const players = useSelector((state) => state.players.players);

    const [gameData, setGameData] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);
    const [timeLeft, setTimeLeft] = useState(20);
    const [musicEnabled, setMusicEnabled] = useState(true);

    const audioCtxRef = useRef(null);
    const musicTimerRef = useRef(null);

    const pin =
        sessionStorage.getItem("gamePin") ||
        game?.pin ||
        localStorage.getItem("gamePin");

    const localPlayerId =
        sessionStorage.getItem("currentPlayerId") ||
        localStorage.getItem("currentPlayerId");

    const localPlayerNickname =
        sessionStorage.getItem("currentPlayerNickname") ||
        localStorage.getItem("currentPlayerNickname");

    const currentPlayer =
        gameData?.players?.find(
            (p) => p.id === localPlayerId
        ) ||
        gameData?.players?.find(
            (p) => p.nickname === localPlayerNickname
        ) ||
        players?.find(
            (p) => p.id === localPlayerId
        ) ||
        players?.[players.length - 1];

    // Reliable AudioContext Resumer
    const resumeAudio = () => {
        try {
            if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume().catch(() => {});
            }
        } catch {
            // ignore
        }
    };

    // Background Tune (Calm, gentle, non-distracting ambient lo-fi game soundtrack)
    useEffect(() => {
        if (!musicEnabled) {
            if (musicTimerRef.current) {
                clearInterval(musicTimerRef.current);
                musicTimerRef.current = null;
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.suspend().catch(() => {});
            }
            return;
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
                audioCtxRef.current = new AudioCtx();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => {});
            }

            // Peaceful, non-distracting ambient melody (C -> G -> Am -> F)
            const melody = [
                { f: 261.63, b: 130.81 }, // C4, C3 bass
                { f: 329.63, b: 130.81 }, // E4
                { f: 392.00, b: 130.81 }, // G4
                { f: 523.25, b: 130.81 }, // C5
                { f: 196.00, b: 98.00 },  // G3, G2 bass
                { f: 246.94, b: 98.00 },  // B3
                { f: 293.66, b: 98.00 },  // D4
                { f: 392.00, b: 98.00 },  // G4
                { f: 220.00, b: 110.00 }, // A3, A2 bass
                { f: 261.63, b: 110.00 }, // C4
                { f: 329.63, b: 110.00 }, // E4
                { f: 440.00, b: 110.00 }, // A4
                { f: 174.61, b: 87.31 },  // F3, F2 bass
                { f: 220.00, b: 87.31 },  // A3
                { f: 261.63, b: 87.31 },  // C4
                { f: 349.23, b: 87.31 },  // F4
            ];
            let noteIndex = 0;

            const playSoftNote = () => {
                if (!ctx) return;
                if (ctx.state === "suspended") {
                    ctx.resume().catch(() => {});
                    return;
                }
                if (ctx.state !== "running") return;

                try {
                    const { f, b } = melody[noteIndex % melody.length];
                    noteIndex++;
                    const now = ctx.currentTime;

                    // 1. Soft melodic chime tone
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();

                    osc.type = "sine";
                    osc.frequency.setValueAtTime(f, now);

                    // Lowpass filter keeps sound warm & relaxing
                    filter.type = "lowpass";
                    filter.frequency.setValueAtTime(650, now);

                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.075, now + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(now);
                    osc.stop(now + 0.4);

                    // 2. Soft bass warmth (plays on alternate beats)
                    if (noteIndex % 2 === 0) {
                        const oscBass = ctx.createOscillator();
                        const gainBass = ctx.createGain();
                        const filterBass = ctx.createBiquadFilter();

                        oscBass.type = "triangle";
                        oscBass.frequency.setValueAtTime(b, now);

                        filterBass.type = "lowpass";
                        filterBass.frequency.setValueAtTime(250, now);

                        gainBass.gain.setValueAtTime(0, now);
                        gainBass.gain.linearRampToValueAtTime(0.055, now + 0.05);
                        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

                        oscBass.connect(filterBass);
                        filterBass.connect(gainBass);
                        gainBass.connect(ctx.destination);

                        oscBass.start(now);
                        oscBass.stop(now + 0.6);
                    }
                } catch {
                    // Ignore audio playback exceptions
                }
            };

            musicTimerRef.current = setInterval(playSoftNote, 340);
        } catch (err) {
            console.log("Background music error:", err);
        }

        return () => {
            if (musicTimerRef.current) {
                clearInterval(musicTimerRef.current);
                musicTimerRef.current = null;
            }
        };
    }, [musicEnabled]);

    // Handle user gestures anywhere on the screen to unlock Web Audio immediately
    useEffect(() => {
        const handleGesture = () => {
            resumeAudio();
        };

        window.addEventListener("pointerdown", handleGesture);
        window.addEventListener("touchstart", handleGesture);
        window.addEventListener("click", handleGesture);
        window.addEventListener("keydown", handleGesture);
        window.addEventListener("mousemove", handleGesture, { once: true });
        window.addEventListener("focus", handleGesture);

        // Attempt initial resume
        resumeAudio();

        return () => {
            window.removeEventListener("pointerdown", handleGesture);
            window.removeEventListener("touchstart", handleGesture);
            window.removeEventListener("click", handleGesture);
            window.removeEventListener("keydown", handleGesture);
            window.removeEventListener("mousemove", handleGesture);
            window.removeEventListener("focus", handleGesture);
            if (musicTimerRef.current) clearInterval(musicTimerRef.current);
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
        };
    }, []);

    // Firebase live game listener
    useEffect(() => {
        if (!pin) {
            navigate("/");
            return;
        }

        const gameRef = doc(db, "games", pin);

        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) {
                navigate("/");
                return;
            }

            const data = snapshot.data();
            setGameData(data);
        });

        return () => unsubscribe();
    }, [pin, navigate]);

    // Current question
    const currentQuestionIndex =
        gameData?.currentQuestionIndex ??
        gameData?.currentQuestion ??
        0;

    const question =
        gameData?.questions?.[currentQuestionIndex];

    const gameStatus = gameData?.status;
    const qDuration = gameData?.questionDuration || question?.timer || 20;
    const qStartedAt = gameData?.questionStartedAt;
    const currentQIdx = gameData?.currentQuestionIndex;

    // Auto-synchronized countdown timer for user
    useEffect(() => {
        if (!gameData || gameStatus !== "playing") return;

        const duration = qDuration;
        const startedAt = qStartedAt || Date.now();

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [gameData, gameStatus, qDuration, qStartedAt, currentQIdx]);

    // Player answer state sync with Firebase
    useEffect(() => {
        if (gameData?.players) {
            const myNick = (localPlayerNickname || "").trim().toLowerCase();
            const me = gameData.players.find(
                (p) =>
                    (localPlayerId && p.id === localPlayerId) ||
                    (myNick && p.nickname?.trim().toLowerCase() === myNick)
            );

            if (me && me.answered) {
                setSubmitted(true);
                if (me.answer) {
                    setSelectedAnswer(me.answer);
                }
                if (me.correct !== undefined) {
                    setIsCorrect(me.correct);
                }
            }
        }
    }, [
        gameData?.players,
        gameData?.currentQuestionIndex,
        localPlayerId,
        localPlayerNickname,
    ]);

    // Reset local selection when question changes
    useEffect(() => {
        setSelectedAnswer("");
        setSubmitted(false);
        setIsCorrect(null);
    }, [gameData?.currentQuestionIndex]);

    // Answer select
    const handleAnswer = (answer) => {
        resumeAudio();
        if (submitted || timeLeft === 0) {
            return;
        }

        setSelectedAnswer(answer);
    };

    const correctOption =
        typeof question?.correctAnswer === "number"
            ? question?.options?.[question?.correctAnswer]
            : question?.correctAnswer;

    // Answer submit with speed-based scoring
    const submitAnswer = async (answerOverride) => {
        resumeAudio();
        const answerToSubmit = answerOverride || selectedAnswer;
        if (
            !answerToSubmit ||
            submitted ||
            timeLeft === 0 ||
            !pin ||
            !question
        ) {
            return;
        }

        try {
            setSubmitted(true);

            const targetCorrect =
                typeof question?.correctAnswer === "number"
                    ? question?.options?.[question?.correctAnswer]
                    : (question?.correctAnswer ?? (typeof question?.correctIndex === "number" ? question?.options?.[question?.correctIndex] : ""));

            const targetStr = (targetCorrect || "").toString().trim().toLowerCase();
            const answerStr = (answerToSubmit || "").toString().trim().toLowerCase();
            const answerIsCorrect = answerStr === targetStr;

            setIsCorrect(answerIsCorrect);

            const duration = gameData?.questionDuration || question?.timer || 20;
            // Faster answer = more points! (500 base + up to 500 speed bonus)
            const speedBonus = Math.max(0, Math.round((timeLeft / duration) * 500));
            const pointsEarned = answerIsCorrect ? 500 + speedBonus : 0;

            const myId = localPlayerId;
            const myNick = (localPlayerNickname || "").trim().toLowerCase();

            const gameRef = doc(db, "games", pin);
            const freshSnap = await getDoc(gameRef);
            const currentPlayers = (freshSnap.exists() && freshSnap.data().players) || gameData?.players || [];

            const updatedPlayers = currentPlayers.map((player) => {
                const isMe = (myId && player.id === myId) ||
                             (myNick && player.nickname?.trim().toLowerCase() === myNick);
                if (isMe) {
                    return {
                        ...player,
                        answer: answerToSubmit,
                        answered: true,
                        correct: answerIsCorrect,
                        timeRemaining: timeLeft,
                        score: (player.score || 0) + pointsEarned,
                        correctCount: (player.correctCount || 0) + (answerIsCorrect ? 1 : 0),
                        wrongCount: (player.wrongCount || 0) + (answerIsCorrect ? 0 : 1),
                        scoreAwarded: true,
                    };
                }

                return player;
            });

            await updateDoc(gameRef, {
                players: updatedPlayers,
            });
        } catch (error) {
            console.error("Answer submit error:", error);
            setSubmitted(false);
        }
    };

    const correctAnswersCount =
        gameData?.players?.filter(
            (p) => p.answered && (p.answer === correctOption || p.correct === true)
        ).length || 0;

    const wrongAnswersCount =
        gameData?.players?.filter(
            (p) => p.answered && (p.answer !== correctOption || p.correct === false)
        ).length || 0;

    // Loading state
    if (!gameData) {
        return (
            <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                        ⏳
                    </div>

                    <p className="text-purple-300 font-medium tracking-wide animate-pulse">
                        Loading question...
                    </p>
                </div>
            </div>
        );
    }

    // Game finished: Display Podium with overall stats
    if (gameData.status === "finished") {
        const sorted = [
            ...(gameData.players || []),
        ].sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );

        const totalCorrect = sorted.reduce(
            (acc, p) => acc + (p.correctCount || (p.correct ? 1 : 0)),
            0
        );
        const totalWrong = sorted.reduce(
            (acc, p) => acc + (p.wrongCount || (p.answered && !p.correct ? 1 : 0)),
            0
        );

        return (
            <Podium
                winners={sorted.map((p) => ({
                    name: p.nickname,
                    nickname: p.nickname,
                    score: p.score || 0,
                    correctCount: p.correctCount,
                    wrongCount: p.wrongCount,
                }))}
                totalCorrect={totalCorrect}
                totalWrong={totalWrong}
            />
        );
    }

    // Question not found
    if (!question) {
        return (
            <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                        ⏳
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                        Waiting for question...
                    </h1>
                </div>
            </div>
        );
    }

    const optionLetters = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
    ];

    const avatars = [
        "🦉",
        "🎮",
        "🚀",
        "👑",
        "⭐",
        "🔥",
        "🎯",
        "⚡",
    ];

    return (
        <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
            {/* Background ambient lighting glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[380px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[280px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex justify-between items-center z-20 mb-2">
                {/* Game PIN Badge */}
                <div className="flex items-center space-x-2 bg-[#1a1438]/90 border border-purple-500/40 text-purple-200 text-xs sm:text-sm px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                    <span className="text-base">🔗</span>
                    <span className="font-semibold text-purple-300">PIN:</span>
                    <span className="font-black text-amber-300 tracking-wider">{pin}</span>
                </div>

                {/* Center Mascot */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] relative">
                    <span className="text-2xl sm:text-3xl">🦉</span>
                    <span className="absolute -top-1 -right-1 text-xs sm:text-sm">💡</span>
                </div>

                {/* Right Controls: Background Music Toggle & Language Selector */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setMusicEnabled((prev) => !prev);
                            resumeAudio();
                        }}
                        className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
                        title="Background Game Music Toggle"
                    >
                        <span>{musicEnabled ? "🔊" : "🔇"}</span>
                        <span className="font-medium hidden sm:inline">{musicEnabled ? "Tune ON" : "Tune OFF"}</span>
                    </button>

                    <button
                        type="button"
                        className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3.5 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
                    >
                        <span>🌐</span>
                        <span className="font-medium">English</span>
                        <span className="text-[10px]">▼</span>
                    </button>
                </div>
            </div>

            {/* Main Glassmorphism Question Card */}
            <div className="w-full max-w-xl relative my-auto z-10">

                {/* Central Top Timer Ring Emblem */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div className={`w-14 h-14 rounded-full bg-[#130a2e] border-4 ${timeLeft <= 5 ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse" : "border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]"} flex flex-col items-center justify-center text-center transition-all`}>
                        <span className={`text-base font-black leading-none ${timeLeft <= 5 ? "text-rose-400" : "text-white"}`}>
                            {timeLeft}
                        </span>
                        <span className="text-[9px] font-bold text-purple-300 uppercase tracking-tighter">sec</span>
                    </div>
                </div>

                <div className="bg-[#120a2e]/95 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.35)] backdrop-blur-xl relative z-10 pt-10">

                    {/* Top Score & Question Info */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Question</span>
                            <span className="text-lg font-black text-amber-300">
                                {gameData.currentQuestionIndex + 1} <span className="text-purple-400/60 font-medium text-sm">/ {gameData.questions?.length || 10}</span>
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Your Score</span>
                            <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                                <span>🏆</span> {currentPlayer?.score || 0}
                            </span>
                        </div>
                    </div>

                    {/* Question Text */}
                    <div className="text-center my-4 sm:my-6">
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-wide">
                            {typeof question.question === "object" ? question.question?.text : (question.questionText || question.question)}
                        </h2>
                        <div className="flex items-center justify-center space-x-2 text-purple-400/50 my-3">
                            <span className="w-8 h-[2px] bg-purple-500/30"></span>
                            <span className="text-amber-400 text-xs">⭐</span>
                            <span className="w-8 h-[2px] bg-purple-500/30"></span>
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3 my-6">
                        {(question.options || [])?.map((option, idx) => {
                            const letter = optionLetters[idx % optionLetters.length];
                            const isSelected = selectedAnswer === option;

                            return (
                                <button
                                    key={option}
                                    onClick={() => handleAnswer(option)}
                                    disabled={submitted || timeLeft === 0}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-200 text-left cursor-pointer border ${isSelected
                                            ? "bg-emerald-950/80 border-2 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                                            : "bg-[#1b113e] border-purple-800/60 hover:border-purple-500/80 text-white"
                                        } ${submitted || timeLeft === 0 ? "cursor-not-allowed opacity-90" : ""}`}
                                >
                                    <div className="flex items-center space-x-3.5">
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-md ${isSelected
                                                    ? "bg-emerald-400 text-black"
                                                    : "bg-purple-900/80 text-purple-200 border border-purple-500/30"
                                                }`}
                                        >
                                            {letter}
                                        </div>
                                        <span className="text-sm sm:text-base font-semibold">{option}</span>
                                    </div>

                                    <div
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                ? "border-emerald-400 bg-emerald-500 text-black"
                                                : "border-purple-600/60 bg-purple-950/40"
                                            }`}
                                    >
                                        {isSelected && <span className="text-xs font-black">✓</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={submitAnswer}
                        disabled={selectedAnswer === "" || submitted || timeLeft === 0}
                        className="w-full mt-4 bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-200/40"
                    >
                        <span>🚀</span>
                        <span>{submitted ? "ANSWER SUBMITTED" : timeLeft === 0 ? "TIME EXPIRED" : "SUBMIT ANSWER"}</span>
                    </button>

                    {/* Live Correct vs Wrong Feedback for current user */}
                    {submitted && isCorrect !== null && (
                        <div className={`mt-3 text-center text-xs sm:text-sm font-extrabold py-2 px-4 rounded-xl border ${isCorrect ? "text-emerald-300 bg-emerald-950/70 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]" : "text-rose-300 bg-rose-950/70 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"}`}>
                            {isCorrect ? "✅ Great job! Your answer is Correct! 🎉" : "❌ Oops! Your answer is Wrong."}
                        </div>
                    )}

                    {/* How many players answered correct vs wrong */}
                    {(submitted || gameData.answerRevealed || timeLeft === 0) && (
                        <div className="mt-3 flex items-center justify-center gap-3">
                            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-300 shadow-sm">
                                <span>✅</span>
                                <span>{correctAnswersCount} Correct</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-500/40 px-3.5 py-1 rounded-full text-xs font-bold text-rose-300 shadow-sm">
                                <span>❌</span>
                                <span>{wrongAnswersCount} Wrong</span>
                            </div>
                        </div>
                    )}

                    {/* Waiting Banner */}
                    {submitted && (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold text-purple-300 animate-pulse">
                            <span>⏳</span>
                            <span>Waiting for the next question...</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Bottom Players Bar */}
            {gameData.players && gameData.players.length > 0 && (
                <div className="w-full max-w-4xl z-20 mt-4">
                    <div className="bg-[#120a2e]/90 border border-purple-800/60 rounded-2xl p-3 backdrop-blur-md flex items-center space-x-3 overflow-x-auto custom-scrollbar">
                        {gameData.players.map((player, idx) => {
                            const isCurrent = player.id === currentPlayer?.id;
                            const avatar = avatars[idx % avatars.length];

                            return (
                                <div
                                    key={player.id || idx}
                                    className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border  transition-all ${isCurrent
                                            ? "bg-purple-900/90 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] relative"
                                            : "bg-[#1b113e]/70 border-purple-800/40 text-purple-200"
                                        }`}
                                >
                                    {isCurrent && (
                                        <span className="absolute -top-2.5 left-3 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                            YOU
                                        </span>
                                    )}
                                    <span className="text-lg">{avatar}</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white leading-tight">
                                            {player.nickname}
                                        </span>
                                        <span className="text-[11px] font-black text-amber-300">
                                            {player.score || 0}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameScreen;