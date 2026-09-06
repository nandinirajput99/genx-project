import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
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

    const pin = game?.pin || localStorage.getItem("gamePin");

    const localPlayerId = localStorage.getItem("currentPlayerId");
    const localPlayerNickname = localStorage.getItem("currentPlayerNickname");

    const currentPlayer =
        gameData?.players?.find((p) => p.id === localPlayerId) ||
        gameData?.players?.find((p) => p.nickname === localPlayerNickname) ||
        players?.find((p) => p.id === localPlayerId) ||
        players?.[players.length - 1];

    // Reliable AudioContext Resumer
    const resumeAudio = useCallback(() => {
        try {
            if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume().catch(() => { });
            }
        } catch {
            // ignore
        }
    }, []);

    // Background Tune (Calm, gentle, non-distracting ambient lo-fi game soundtrack)
    useEffect(() => {
        if (!musicEnabled) {
            if (musicTimerRef.current) {
                clearInterval(musicTimerRef.current);
                musicTimerRef.current = null;
            }
            if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
                audioCtxRef.current.suspend().catch(() => { });
            }
            return;
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioCtx();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === "suspended") {
                ctx.resume().catch(() => { });
            }

            // Peaceful, non-distracting ambient melody (C -> G -> Am -> F)
            const melody = [
                { f: 261.63, b: 130.81 },
                { f: 329.63, b: 130.81 },
                { f: 392.00, b: 130.81 },
                { f: 523.25, b: 130.81 },
                { f: 196.00, b: 98.00 },
                { f: 246.94, b: 98.00 },
                { f: 293.66, b: 98.00 },
                { f: 392.00, b: 98.00 },
                { f: 220.00, b: 110.00 },
                { f: 261.63, b: 110.00 },
                { f: 329.63, b: 110.00 },
                { f: 440.00, b: 110.00 },
                { f: 174.61, b: 87.31 },
                { f: 220.00, b: 87.31 },
                { f: 261.63, b: 87.31 },
                { f: 349.23, b: 87.31 },
            ];
            let noteIndex = 0;

            const playSoftNote = () => {
                if (!ctx) return;
                if (ctx.state === "suspended") {
                    ctx.resume().catch(() => { });
                    return;
                }
                if (ctx.state !== "running") return;

                try {
                    const { f, b } = melody[noteIndex % melody.length];
                    noteIndex++;
                    const now = ctx.currentTime;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();

                    osc.type = "sine";
                    osc.frequency.setValueAtTime(f, now);

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
                audioCtxRef.current.close().catch(() => { });
            }
        };
    }, [resumeAudio]);

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

            // If game is in lobby, redirect to lobby
            if (data.status === "waiting") {
                navigate("/player/lobby");
            }
        });

        return () => unsubscribe();
    }, [pin, navigate]);

    // Current question
    const currentQuestionIndex =
        gameData?.currentQuestionIndex ??
        gameData?.currentQuestion ??
        0;

    const question = gameData?.questions?.[currentQuestionIndex];
    const questionText =
        typeof question?.question === "object"
            ? question?.question?.text
            : (question?.questionText || question?.question || "");

    const correctOption =
        typeof question?.correctAnswer === "number"
            ? question?.options?.[question?.correctAnswer]
            : question?.correctAnswer;

    // Auto-synchronized countdown timer for user
    const gameStatus = gameData?.status;
    const questionDuration = gameData?.questionDuration || question?.timer || 20;
    const questionStartedAt = gameData?.questionStartedAt;

    useEffect(() => {
        if (gameStatus !== "playing") return;

        const duration = questionDuration;
        const startedAt = questionStartedAt || Date.now();

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startedAt) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [gameStatus, questionDuration, questionStartedAt]);

    // Player answer state sync with Firebase
    useEffect(() => {
        if (gameData?.players) {
            const me = gameData.players.find(
                (p) =>
                    p.id === localPlayerId ||
                    p.nickname === localPlayerNickname
            );

            if (me) {
                setSubmitted(!!me.answered);
                setSelectedAnswer(me.answer || "");
                if (me.correct !== undefined && me.correct !== null) {
                    setIsCorrect(me.correct);
                }
            } else {
                setSubmitted(false);
                setSelectedAnswer("");
                setIsCorrect(null);
            }
        }
    }, [
        gameData?.players,
        localPlayerId,
        localPlayerNickname,
    ]);

    // Reset local selection when question index changes
    useEffect(() => {
        setSelectedAnswer("");
        setSubmitted(false);
        setIsCorrect(null);
    }, [currentQuestionIndex]);

    // Answer select
    const handleAnswer = (answer) => {
        resumeAudio();
        if (submitted || timeLeft === 0 || gameData?.answerRevealed) {
            return;
        }

        setSelectedAnswer(answer);
    };

    // Atomic Answer Submit with Concurrency Protection (runTransaction)
    const submitAnswer = async () => {
        resumeAudio();
        if (
            selectedAnswer === "" ||
            submitted ||
            timeLeft === 0 ||
            !pin ||
            !question
        ) {
            return;
        }

        try {
            const answerIsCorrect = selectedAnswer === correctOption;
            setIsCorrect(answerIsCorrect);
            setSubmitted(true);

            const duration = gameData?.questionDuration || question?.timer || 20;
            const speedBonus = answerIsCorrect && duration > 0
                ? Math.max(0, Math.round((timeLeft / duration) * 500))
                : 0;
            const pointsEarned = answerIsCorrect ? 500 + speedBonus : 0;

            const gameRef = doc(db, "games", pin);

            // Execute atomic transaction so multiple players submitting at the same time never overwrite each other
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameRef);
                if (!gameSnap.exists()) return;

                const liveData = gameSnap.data();
                const livePlayers = liveData.players || [];

                const updatedPlayers = livePlayers.map((player) => {
                    const isTargetPlayer =
                        player.id === (localPlayerId || currentPlayer?.id) ||
                        player.nickname === (localPlayerNickname || currentPlayer?.nickname);

                    if (isTargetPlayer) {
                        // Prevent re-scoring if already recorded
                        if (player.scoredForQuestion === currentQuestionIndex) {
                            return player;
                        }

                        return {
                            ...player,
                            answer: selectedAnswer,
                            answered: true,
                            correct: answerIsCorrect,
                            timeRemaining: timeLeft,
                            score: (player.score || 0) + pointsEarned,
                            correctCount: (player.correctCount || 0) + (answerIsCorrect ? 1 : 0),
                            wrongCount: (player.wrongCount || 0) + (answerIsCorrect ? 0 : 1),
                            scoredForQuestion: currentQuestionIndex,
                        };
                    }

                    return player;
                });

                transaction.update(gameRef, {
                    players: updatedPlayers,
                });
            });
        } catch (error) {
            console.log("Answer submit transaction error:", error);
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

    // Game finished: Display Podium with winners
    if (gameData.status === "finished") {
        const sorted = [...(gameData.players || [])].sort(
            (a, b) => (b.score || 0) - (a.score || 0)
        );

        return (
            <Podium
                winners={sorted.map((p) => ({
                    id: p.id,
                    name: p.nickname,
                    nickname: p.nickname,
                    score: p.score || 0,
                }))}
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

    const optionLetters = ["A", "B", "C", "D", "E", "F"];
    const avatars = ["🦉", "🎮", "🚀", "👑", "⭐", "🔥", "🎯", "⚡"];
    const isAnswerRevealed = !!gameData.answerRevealed || timeLeft === 0;

    return (
        <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">
            {/* Background ambient lighting glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-95 bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-70 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

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

                {/* Right Controls: Background Music Toggle */}
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
                        <span className="font-medium hidden sm:inline">{musicEnabled ? "Music ON" : "Music OFF"}</span>
                    </button>
                </div>
            </div>

            {/* Main Glassmorphism Question Card (Kahoot Style) */}
            <div className="w-full max-w-2xl relative my-auto z-10">
                {/* Central Top Timer Ring Emblem */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div
                        className={`w-14 h-14 rounded-full bg-[#130a2e] border-4 ${timeLeft <= 5
                                ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse"
                                : "border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                            } flex flex-col items-center justify-center text-center transition-all`}
                    >
                        <span
                            className={`text-base font-black leading-none ${timeLeft <= 5 ? "text-rose-400" : "text-white"
                                }`}
                        >
                            {timeLeft}
                        </span>
                        <span className="text-[9px] font-bold text-purple-300 uppercase tracking-tighter">
                            sec
                        </span>
                    </div>
                </div>

                <div className="bg-[#120a2e]/95 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(147,51,234,0.25)] backdrop-blur-xl relative z-10 pt-10">
                    {/* Top Score & Question Info */}
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                                Question
                            </span>
                            <span className="text-lg font-black text-amber-300">
                                {currentQuestionIndex + 1}{" "}
                                <span className="text-purple-400/60 font-medium text-sm">
                                    / {gameData.questions?.length || 10}
                                </span>
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                                Your Score
                            </span>
                            <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                                <span>🏆</span> {currentPlayer?.score || 0}
                            </span>
                        </div>
                    </div>

                    {/* Question Text */}
                    <div className="text-center my-4 sm:my-6">
                        <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-wide">
                            {questionText}
                        </h2>
                        <div className="flex items-center justify-center space-x-2 text-purple-400/50 my-3">
                            <span className="w-8 h-0.5 bg-purple-500/30"></span>
                            <span className="text-amber-400 text-xs">⭐</span>
                            <span className="w-8 h-0.5 bg-purple-500/30"></span>
                        </div>
                    </div>

                    {/* Kahoot 4-Shape Options Grid (Responsive 2x2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
                        {question.options?.map((option, idx) => {
                            const kahootShapes = [
                                { shape: "▲", badge: "bg-[#e21b3c] text-white", cardDefault: "bg-[#e21b3c]/15 hover:bg-[#e21b3c]/25 border-[#e21b3c]/40 text-white" },
                                { shape: "◆", badge: "bg-[#1368ce] text-white", cardDefault: "bg-[#1368ce]/15 hover:bg-[#1368ce]/25 border-[#1368ce]/40 text-white" },
                                { shape: "●", badge: "bg-[#d89e00] text-slate-950 font-black", cardDefault: "bg-[#d89e00]/15 hover:bg-[#d89e00]/25 border-[#d89e00]/40 text-white" },
                                { shape: "■", badge: "bg-[#26890c] text-white", cardDefault: "bg-[#26890c]/15 hover:bg-[#26890c]/25 border-[#26890c]/40 text-white" },
                            ];
                            const shapeMeta = kahootShapes[idx % kahootShapes.length];
                            const letter = optionLetters[idx % optionLetters.length];
                            const isSelected = selectedAnswer === option;
                            const isCorrectAnswer = option === correctOption;

                            // Kahoot option state styling
                            let btnStyle = shapeMeta.cardDefault;
                            let badgeStyle = shapeMeta.badge;

                            if (isAnswerRevealed) {
                                if (isCorrectAnswer) {
                                    btnStyle = "bg-emerald-950/90 border-2 border-emerald-400 text-white shadow-[0_0_25px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400/40";
                                    badgeStyle = "bg-emerald-400 text-black";
                                } else if (isSelected && !isCorrectAnswer) {
                                    btnStyle = "bg-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]";
                                    badgeStyle = "bg-rose-500 text-white";
                                } else {
                                    btnStyle = "bg-[#1b113e]/40 border-purple-900/30 text-purple-400/40 opacity-40";
                                    badgeStyle = "bg-purple-900/40 text-purple-400";
                                }
                            } else if (isSelected) {
                                btnStyle = "bg-[#261b55] border-2 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/30";
                                badgeStyle = "bg-amber-400 text-black";
                            }

                            return (
                                <button
                                    key={option}
                                    onClick={() => handleAnswer(option)}
                                    disabled={submitted || timeLeft === 0 || isAnswerRevealed}
                                    className={`w-full min-h-[64px] flex items-center justify-between p-3.5 sm:p-4 rounded-2xl font-bold transition-all duration-200 text-left border cursor-pointer active:scale-[0.98] ${btnStyle} ${submitted || timeLeft === 0 || isAnswerRevealed ? "cursor-default active:scale-100" : ""
                                        }`}
                                >
                                    <div className="flex items-center space-x-3 min-w-0">
                                        {/* Kahoot Shape Icon Badge */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${badgeStyle}`}>
                                            {shapeMeta.shape}
                                        </div>
                                        <span className="text-sm sm:text-base font-bold truncate">
                                            {option}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                        {isAnswerRevealed && isCorrectAnswer && (
                                            <span className="text-[10px] bg-emerald-400 text-black font-black px-2 py-0.5 rounded shadow-sm">
                                                CORRECT
                                            </span>
                                        )}
                                        {isAnswerRevealed && isSelected && !isCorrectAnswer && (
                                            <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded shadow-sm">
                                                WRONG
                                            </span>
                                        )}
                                        {!isAnswerRevealed && (
                                            <div
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                        ? "border-amber-400 bg-amber-400 text-black"
                                                        : "border-purple-600/40 bg-purple-950/20"
                                                    }`}
                                            >
                                                {isSelected && <span className="text-[10px] font-black">✓</span>}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Submit Button */}
                    {!isAnswerRevealed && (
                        <button
                            onClick={submitAnswer}
                            disabled={selectedAnswer === "" || submitted || timeLeft === 0}
                            className="w-full mt-2 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.4)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-200/40"
                        >
                            <span>🚀</span>
                            <span>{submitted ? "ANSWER SUBMITTED" : timeLeft === 0 ? "TIME EXPIRED" : "SUBMIT ANSWER"}</span>
                        </button>
                    )}

                    {/* Answer Feedback Banner */}
                    {isAnswerRevealed ? (
                        <div
                            className={`mt-4 text-center text-xs sm:text-sm font-extrabold py-3 px-4 rounded-2xl border ${!submitted
                                    ? "text-amber-300 bg-amber-950/60 border-amber-500/40"
                                    : isCorrect
                                        ? "text-emerald-300 bg-emerald-950/70 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                        : "text-rose-300 bg-rose-950/70 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                                }`}
                        >
                            {!submitted
                                ? "⏰ Time's up! You did not submit an answer in time."
                                : isCorrect
                                    ? "✅ Great job! Your answer is Correct! 🎉"
                                    : "❌ Oops! Your answer was Incorrect."}
                        </div>
                    ) : submitted ? (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold text-purple-300 animate-pulse">
                            <span>⏳</span>
                            <span>Answer locked in! Waiting for host / timer...</span>
                        </div>
                    ) : null}

                    {/* Live Answer Statistics */}
                    {isAnswerRevealed && (
                        <div className="mt-4 flex items-center justify-center gap-3">
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
                                    className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border transition-all ${isCurrent
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