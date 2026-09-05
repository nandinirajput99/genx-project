import { useEffect, useState } from "react";
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

    const pin = game?.pin || localStorage.getItem("gamePin");

    const localPlayerId = localStorage.getItem("currentPlayerId");
    const localPlayerNickname = localStorage.getItem(
        "currentPlayerNickname"
    );

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

    // Firebase se live game data
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

    // Player ka answer Firebase se sync
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
            }
        }
    }, [
        gameData,
        localPlayerId,
        localPlayerNickname,
    ]);

    // Current question
    const currentQuestionIndex =
        gameData?.currentQuestionIndex ??
        gameData?.currentQuestion ??
        0;

    const question =
        gameData?.questions?.[currentQuestionIndex];

    // Answer select
    const handleAnswer = (answer) => {
        if (submitted) {
            return;
        }

        setSelectedAnswer(answer);
    };

    // Answer submit
    const submitAnswer = async () => {
        if (
            selectedAnswer === "" ||
            submitted ||
            !gameData?.players ||
            !question
        ) {
            return;
        }

        try {
            // Check correct / wrong
            const answerIsCorrect =
                selectedAnswer === question.correctAnswer;

            setIsCorrect(answerIsCorrect);

            const gameRef = doc(db, "games", pin);

            const updatedPlayers = gameData.players.map(
                (player) => {
                    if (
                        player.id === currentPlayer?.id ||
                        player.nickname ===
                            currentPlayer?.nickname
                    ) {
                        return {
                            ...player,
                            answer: selectedAnswer,
                            answered: true,
                        };
                    }

                    return player;
                }
            );

            await updateDoc(gameRef, {
                players: updatedPlayers,
            });

            setSubmitted(true);
        } catch (error) {
            console.log(
                "Answer submit error:",
                error
            );
        }
    };
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

    // Game finished
    if (gameData.status === "finished") {
        const sorted = [
            ...(gameData.players || []),
        ].sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );

        return (
            <Podium
                winners={sorted.map((p) => ({
                    name: p.nickname,
                    score: p.score || 0,
                }))}
            />
        );
    }

    // Question nahi mili
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
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-380px bg-purple-600/20 blur-[130px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-280px bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

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

                {/* Language Selector */}
                <button
                    type="button"
                    className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3.5 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
                >
                    <span>🌐</span>
                    <span className="font-medium">English</span>
                    <span className="text-[10px]">▼</span>
                </button>
            </div>

            {/* Main Glassmorphism Question Card */}
            <div className="w-full max-w-xl relative my-auto z-10">

                {/* Central Top Timer Ring Emblem */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div className="w-15 h-15 rounded-full bg-[#130a2e] border-4 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)] flex flex-col items-center justify-center text-center">
                        <span className="text-base font-black text-white leading-none">15</span>
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
                            {question.question}
                        </h2>
                        <div className="flex items-center justify-center space-x-2 text-purple-400/50 my-3">
                            <span className="w-8 h-2px bg-purple-500/30"></span>
                            <span className="text-amber-400 text-xs">⭐</span>
                            <span className="w-8 h-2px bg-purple-500/30"></span>
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-3 my-6">
                        {question.options?.map((option, idx) => {
                            const letter = optionLetters[idx % optionLetters.length];
                            const isSelected = selectedAnswer === option;

                            return (
                                <button
                                    key={option}
                                    onClick={() => handleAnswer(option)}
                                    disabled={submitted}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-200 text-left cursor-pointer border ${isSelected
                                            ? "bg-emerald-950/80 border-2 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                                            : "bg-[#1b113e] border-purple-800/60 hover:border-purple-500/80 text-white"
                                        } ${submitted ? "cursor-not-allowed opacity-90" : ""}`}
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
                        disabled={selectedAnswer === "" || submitted}
                        className="w-full mt-4 bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.5)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-200/40"
                    >
                        <span>🚀</span>
                        <span>{submitted ? "ANSWER SUBMITTED" : "SUBMIT ANSWER"}</span>
                    </button>

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
                                        <span className="absolute -top-2.5 left-3 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
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