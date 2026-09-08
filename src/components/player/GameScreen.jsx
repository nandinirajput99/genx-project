import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import Podium from "../common/Podium";

import {
    FaVolumeUp,
    FaVolumeMute,
    FaLightbulb,
    FaRocket,
    FaClock,
    FaTrophy,
    FaCheck,
    FaTimes,
    FaLink,
    FaStar,
    FaFire,
    FaGamepad,
    FaCrown,
    FaBullseye,
    FaBolt,
    FaRedoAlt,
} from "react-icons/fa";

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

    // Keeps option order stable for the whole question
    const [shuffledOptions, setShuffledOptions] = useState([]);

    // ---------- AUDIO REFS ----------

    const audioCtxRef = useRef(null);
    const musicTimerRef = useRef(null);
    const timeUpPlayedRef = useRef(false);

    // ---------- STREAK REFS ----------

    // Previous streak is required to know whether
    // a 3+ streak has been broken.
    const previousStreakRef = useRef(0);

    // Prevents the popup/sound from playing multiple times
    // for the same wrong answer.
    const streakBreakHandledRef = useRef(false);

    // ---------- STREAK POPUP ----------

    const [showStreakBreak, setShowStreakBreak] = useState(false);

    const pin =
        game?.pin ||
        localStorage.getItem("gamePin");

    const localPlayerId =
        localStorage.getItem("currentPlayerId");

    const localPlayerNickname =
        localStorage.getItem(
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

    // =========================================================
    // AUDIO
    // =========================================================

    const getAudioContext = useCallback(() => {
        try {
            const AudioCtx =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioCtx) return null;

            if (!audioCtxRef.current) {
                audioCtxRef.current =
                    new AudioCtx();
            }

            return audioCtxRef.current;
        } catch {
            return null;
        }
    }, []);

    const resumeAudio = useCallback(() => {
        const ctx = getAudioContext();

        if (ctx?.state === "suspended") {
            ctx.resume().catch(() => {});
        }
    }, [getAudioContext]);

    // =========================================================
    // MOTIVATIONAL STREAK BREAK SOUND
    // =========================================================

    const playStreakBreakSound =
        useCallback(() => {
            const ctx = getAudioContext();

            if (!ctx) return;

            try {
                if (ctx.state === "suspended") {
                    ctx.resume().catch(() => {});
                }

                const now = ctx.currentTime;

                const osc =
                    ctx.createOscillator();

                const gain =
                    ctx.createGain();

                osc.type = "sine";

                // Soft descending tone
                osc.frequency.setValueAtTime(
                    520,
                    now
                );

                osc.frequency.exponentialRampToValueAtTime(
                    380,
                    now + 0.25
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.08,
                    now + 0.03
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.35
                );

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.4);
            } catch {
                // Ignore browser audio errors
            }
        }, [getAudioContext]);

    // =========================================================
    // BACKGROUND MUSIC
    // =========================================================

    useEffect(() => {
        if (!musicEnabled) {
            if (musicTimerRef.current) {
                clearInterval(
                    musicTimerRef.current
                );

                musicTimerRef.current = null;
            }

            return;
        }

        const ctx = getAudioContext();

        if (!ctx) return;

        const melody = [
            261.63,
            329.63,
            392.0,
            329.63,
            293.66,
            349.23,
            440.0,
            349.23,
        ];

        let noteIndex = 0;

        const playSoftNote = () => {
            if (ctx.state !== "running") return;

            try {
                const now = ctx.currentTime;

                const osc =
                    ctx.createOscillator();

                const gain =
                    ctx.createGain();

                const filter =
                    ctx.createBiquadFilter();

                osc.type = "sine";

                osc.frequency.setValueAtTime(
                    melody[
                        noteIndex %
                            melody.length
                    ],
                    now
                );

                filter.type = "lowpass";

                filter.frequency.setValueAtTime(
                    700,
                    now
                );

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.012,
                    now + 0.05
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.38
                );

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.4);

                noteIndex += 1;
            } catch {
                // Ignore browser audio errors
            }
        };

        musicTimerRef.current =
            setInterval(
                playSoftNote,
                650
            );

        return () => {
            if (musicTimerRef.current) {
                clearInterval(
                    musicTimerRef.current
                );

                musicTimerRef.current = null;
            }
        };
    }, [
        musicEnabled,
        getAudioContext,
    ]);

    // =========================================================
    // UNLOCK WEB AUDIO
    // =========================================================

    useEffect(() => {
        const handleGesture = () => {
            resumeAudio();
        };

        window.addEventListener(
            "pointerdown",
            handleGesture,
            { once: true }
        );

        window.addEventListener(
            "keydown",
            handleGesture,
            { once: true }
        );

        return () => {
            window.removeEventListener(
                "pointerdown",
                handleGesture
            );

            window.removeEventListener(
                "keydown",
                handleGesture
            );

            if (musicTimerRef.current) {
                clearInterval(
                    musicTimerRef.current
                );
            }

            if (
                audioCtxRef.current &&
                audioCtxRef.current.state !==
                    "closed"
            ) {
                audioCtxRef.current
                    .close()
                    .catch(() => {});
            }
        };
    }, [resumeAudio]);

    // =========================================================
    // FIREBASE LIVE GAME LISTENER
    // =========================================================

    useEffect(() => {
        if (!pin) {
            navigate("/");
            return;
        }

        const gameRef = doc(
            db,
            "games",
            pin
        );

        const unsubscribe = onSnapshot(
            gameRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    navigate("/");
                    return;
                }

                const data =
                    snapshot.data();

                setGameData(data);

                if (
                    data.status ===
                    "waiting"
                ) {
                    navigate(
                        "/player/lobby"
                    );
                }
            },
            (error) => {
                console.error(
                    "Game listener error:",
                    error
                );
            }
        );

        return () => unsubscribe();
    }, [pin, navigate]);

    // =========================================================
    // CURRENT QUESTION
    // =========================================================

    const currentQuestionIndex =
        gameData?.currentQuestionIndex ??
        gameData?.currentQuestion ??
        0;

    const question =
        gameData?.questions?.[
            currentQuestionIndex
        ];

    const questionText =
        typeof question?.question ===
        "object"
            ? question?.question?.text
            : question?.questionText ||
              question?.question ||
              "";

    const correctOption =
        typeof question?.correctAnswer ===
        "number"
            ? question?.options?.[
                  question.correctAnswer
              ]
            : question?.correctAnswer;

    // =========================================================
    // SHUFFLE OPTIONS
    // =========================================================

    useEffect(() => {
        const options =
            Array.isArray(
                question?.options
            )
                ? [...question.options]
                : [];

        for (
            let i = options.length - 1;
            i > 0;
            i -= 1
        ) {
            const j = Math.floor(
                Math.random() *
                    (i + 1)
            );

            [
                options[i],
                options[j],
            ] = [
                options[j],
                options[i],
            ];
        }

        setShuffledOptions(
            options
        );
    }, [currentQuestionIndex]);

    // =========================================================
    // TIMER
    // =========================================================

    const gameStatus =
        gameData?.status;

    const questionDuration =
        gameData?.questionDuration ||
        question?.timer ||
        20;

    const questionStartedAt =
        gameData?.questionStartedAt;

    useEffect(() => {
        if (
            gameStatus !==
            "playing"
        ) {
            return;
        }

        const duration =
            Number(
                questionDuration
            ) || 20;

        const startedAt =
            questionStartedAt ||
            Date.now();

        const updateTimer = () => {
            const elapsed =
                Math.floor(
                    (Date.now() -
                        startedAt) /
                        1000
                );

            const remaining =
                Math.max(
                    0,
                    duration -
                        elapsed
                );

            setTimeLeft(
                remaining
            );
        };

        updateTimer();

        const interval =
            setInterval(
                updateTimer,
                1000
            );

        return () =>
            clearInterval(
                interval
            );
    }, [
        gameStatus,
        questionDuration,
        questionStartedAt,
    ]);

    // =========================================================
    // PLAYER ANSWER SYNC
    // =========================================================

    useEffect(() => {
        if (!gameData?.players) {
            return;
        }

        const me =
            gameData.players.find(
                (p) =>
                    p.id ===
                        localPlayerId ||
                    p.nickname ===
                        localPlayerNickname
            );

        if (me) {
            setSubmitted(
                !!me.answered
            );

            setSelectedAnswer(
                me.answer || ""
            );

            if (
                me.correct !==
                    undefined &&
                me.correct !== null
            ) {
                setIsCorrect(
                    me.correct
                );
            }

            // Current streak stored in Firebase
            const currentStreak =
                me.currentStreak || 0;

            // Streak before this answer
            const previousStreak =
                previousStreakRef.current;

            // =================================================
            // STREAK BREAK
            // =================================================

            if (
                me.correct === false &&
                previousStreak >= 3 &&
                !streakBreakHandledRef.current
            ) {
                streakBreakHandledRef.current =
                    true;

                // Play soft motivational sound
                playStreakBreakSound();

                // Show popup
                setShowStreakBreak(
                    true
                );

                // Hide popup after 1.8 sec
                setTimeout(() => {
                    setShowStreakBreak(
                        false
                    );
                }, 1800);
            }

            // Save current streak
            // for next Firebase update
            previousStreakRef.current =
                currentStreak;
        } else {
            setSubmitted(false);
            setSelectedAnswer("");
            setIsCorrect(null);
        }
    }, [
        gameData?.players,
        localPlayerId,
        localPlayerNickname,
        playStreakBreakSound,
    ]);

    // =========================================================
    // RESET QUESTION STATE
    // =========================================================

    useEffect(() => {
        setSelectedAnswer("");
        setSubmitted(false);
        setIsCorrect(null);

        timeUpPlayedRef.current =
            false;

        // Only reset the "handled" flag.
        // We DO NOT reset previousStreakRef,
        // because we need it for the next question.
        streakBreakHandledRef.current =
            false;
    }, [currentQuestionIndex]);

    // =========================================================
    // ANSWER SELECT
    // =========================================================

    const handleAnswer = (
        answer
    ) => {
        resumeAudio();

        if (
            submitted ||
            timeLeft === 0 ||
            gameData?.answerRevealed
        ) {
            return;
        }

        setSelectedAnswer(
            answer
        );
    };

    // =========================================================
    // ANSWER SUBMIT
    // =========================================================

    const submitAnswer =
        async () => {
            resumeAudio();

            if (
                selectedAnswer ===
                    "" ||
                submitted ||
                timeLeft === 0 ||
                !pin ||
                !question
            ) {
                return;
            }

            // Lock UI immediately
            setSubmitted(true);

            try {
                const answerIsCorrect =
                    selectedAnswer ===
                    correctOption;

                setIsCorrect(
                    answerIsCorrect
                );

                const duration =
                    gameData?.questionDuration ||
                    question?.timer ||
                    20;

                const speedBonus =
                    answerIsCorrect &&
                    duration > 0
                        ? Math.max(
                              0,
                              Math.round(
                                  (timeLeft /
                                      duration) *
                                      500
                              )
                          )
                        : 0;

                const pointsEarned =
                    answerIsCorrect
                        ? 500 +
                          speedBonus
                        : 0;

                const gameRef =
                    doc(
                        db,
                        "games",
                        pin
                    );

                await runTransaction(
                    db,
                    async (
                        transaction
                    ) => {
                        const gameSnap =
                            await transaction.get(
                                gameRef
                            );

                        if (
                            !gameSnap.exists()
                        ) {
                            return;
                        }

                        const liveData =
                            gameSnap.data();

                        const livePlayers =
                            liveData.players ||
                            [];

                        const updatedPlayers =
                            livePlayers.map(
                                (
                                    player
                                ) => {
                                    const isTargetPlayer =
                                        player.id ===
                                            (localPlayerId ||
                                                currentPlayer?.id) ||
                                        player.nickname ===
                                            (localPlayerNickname ||
                                                currentPlayer?.nickname);

                                    if (
                                        !isTargetPlayer
                                    ) {
                                        return player;
                                    }

                                    // Prevent duplicate scoring
                                    if (
                                        player.scoredForQuestion ===
                                        currentQuestionIndex
                                    ) {
                                        return player;
                                    }

                                    // ====================================
                                    // STREAK CALCULATION
                                    // ====================================

                                    const previousStreak =
                                        player.currentStreak ||
                                        0;

                                    const newStreak =
                                        answerIsCorrect
                                            ? previousStreak +
                                              1
                                            : 0;

                                    const bestStreak =
                                        Math.max(
                                            player.bestStreak ||
                                                0,
                                            newStreak
                                        );

                                    return {
                                        ...player,

                                        answer:
                                            selectedAnswer,

                                        answered:
                                            true,

                                        correct:
                                            answerIsCorrect,

                                        timeRemaining:
                                            timeLeft,

                                        score:
                                            (player.score ||
                                                0) +
                                            pointsEarned,

                                        correctCount:
                                            (player.correctCount ||
                                                0) +
                                            (answerIsCorrect
                                                ? 1
                                                : 0),

                                        wrongCount:
                                            (player.wrongCount ||
                                                0) +
                                            (answerIsCorrect
                                                ? 0
                                                : 1),

                                        // Current streak
                                        currentStreak:
                                            newStreak,

                                        // Highest streak
                                        bestStreak:
                                            bestStreak,

                                        scoredForQuestion:
                                            currentQuestionIndex,
                                    };
                                }
                            );

                        transaction.update(
                            gameRef,
                            {
                                players:
                                    updatedPlayers,
                            }
                        );
                    }
                );
            } catch (error) {
                setSubmitted(
                    false
                );

                console.error(
                    "Answer submit transaction error:",
                    error
                );
            }
        };

    // =========================================================
    // STATS
    // =========================================================

    const correctAnswersCount =
        gameData?.players?.filter(
            (p) =>
                p.answered &&
                (p.answer ===
                    correctOption ||
                    p.correct === true)
        ).length || 0;

    const wrongAnswersCount =
        gameData?.players?.filter(
            (p) =>
                p.answered &&
                (p.answer !==
                    correctOption ||
                    p.correct === false)
        ).length || 0;

    // =========================================================
    // LOADING
    // =========================================================

    if (!gameData) {
        return (
            <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
                <div className="flex flex-col items-center space-y-4">

                    <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                        <FaClock />
                    </div>

                    <p className="text-purple-300 font-medium tracking-wide animate-pulse">
                        Loading question...
                    </p>

                </div>
            </div>
        );
    }

    // =========================================================
    // FINISHED
    // =========================================================

    if (
        gameData.status ===
        "finished"
    ) {
        const sorted = [
            ...(gameData.players ||
                []),
        ].sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );

        return (
            <Podium
                winners={sorted.map(
                    (p) => ({
                        id: p.id,
                        name: p.nickname,
                        nickname:
                            p.nickname,
                        score:
                            p.score || 0,
                    })
                )}
            />
        );
    }

    // =========================================================
    // QUESTION NOT FOUND
    // =========================================================

    if (!question) {
        return (
            <div className="min-h-screen bg-[#0b071e] text-white flex items-center justify-center p-4 font-sans select-none">
                <div className="flex flex-col items-center space-y-4">

                    <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
                        <FaClock />
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                        Waiting for question...
                    </h1>

                </div>
            </div>
        );
    }

    const avatars = [
        <FaStar />,
        <FaGamepad />,
        <FaRocket />,
        <FaCrown />,
        <FaStar />,
        <FaFire />,
        <FaBullseye />,
        <FaBolt />,
    ];

    const isAnswerRevealed =
        !!gameData.answerRevealed ||
        timeLeft === 0;

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-x-hidden relative font-sans select-none">

            {/* =================================================
                STREAK BREAK MOTIVATIONAL POPUP
            ================================================= */}

            {showStreakBreak && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">

                    <div className="absolute inset-0 bg-purple-600/10 backdrop-blur-[2px]" />

                    <div className="relative animate-bounce">

                        <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full" />

                        <div className="relative bg-[#171039]/95 border border-amber-400/50 rounded-3xl px-8 py-7 text-center shadow-[0_0_60px_rgba(251,191,36,0.3)] backdrop-blur-xl">

                            <div className="flex justify-center mb-3 text-amber-300 text-4xl">

                                <FaStar />

                            </div>

                            <h2 className="text-2xl font-black text-amber-300">
                                Nice Try!
                            </h2>

                            <p className="text-white font-semibold mt-2">
                                Your streak ended,
                                but keep going!
                            </p>

                            <p className="text-purple-300 text-sm mt-1 flex items-center justify-center gap-2">

                                <FaRedoAlt />

                                <span>
                                    You can build it again
                                </span>

                            </p>

                        </div>

                    </div>

                </div>
            )}

            {/* =================================================
                BACKGROUND
            ================================================= */}

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-95 bg-purple-600/20 blur-[130px] rounded-full pointer-events-none" />

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-70 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />

            {/* =================================================
                TOP NAVIGATION
            ================================================= */}

            <div className="w-full max-w-4xl flex justify-between items-center z-20 mb-2">

                {/* PIN */}

                <div className="flex items-center space-x-2 bg-[#1a1438]/90 border border-purple-500/40 text-purple-200 text-xs sm:text-sm px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">

                    <FaLink className="text-purple-300" />

                    <span className="font-semibold text-purple-300">
                        PIN:
                    </span>

                    <span className="font-black text-amber-300 tracking-wider">
                        {pin}
                    </span>

                </div>

                {/* CENTER ICON */}

                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] relative">

                    <FaLightbulb className="text-2xl sm:text-3xl text-amber-300" />

                </div>

                {/* MUSIC */}

                <div className="flex items-center gap-2">

                    <button
                        type="button"
                        onClick={() => {
                            setMusicEnabled(
                                (prev) =>
                                    !prev
                            );

                            resumeAudio();
                        }}
                        className="flex items-center space-x-1.5 bg-[#1a1438]/80 border border-purple-500/30 text-purple-200 text-xs sm:text-sm px-3 py-1.5 rounded-full backdrop-blur-md hover:bg-purple-900/40 transition cursor-pointer shadow-lg"
                        title="Background Game Music Toggle"
                    >

                        {musicEnabled ? (
                            <FaVolumeUp />
                        ) : (
                            <FaVolumeMute />
                        )}

                        <span className="font-medium hidden sm:inline">
                            {musicEnabled
                                ? "Music ON"
                                : "Music OFF"}
                        </span>

                    </button>

                </div>

            </div>

            {/* =================================================
                MAIN QUESTION CARD
            ================================================= */}

            <div className="w-full max-w-2xl relative my-auto z-10">

                {/* TIMER */}

                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">

                    <div
                        className={`w-14 h-14 rounded-full bg-[#130a2e] border-4 ${
                            timeLeft <= 5
                                ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.8)] animate-pulse"
                                : "border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                        } flex flex-col items-center justify-center text-center transition-all`}
                    >

                        <span
                            className={`text-base font-black leading-none ${
                                timeLeft <= 5
                                    ? "text-rose-400"
                                    : "text-white"
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

                    {/* =================================================
                        SCORE / QUESTION
                    ================================================= */}

                    <div className="flex justify-between items-center mb-5">

                        <div className="flex flex-col">

                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                                Question
                            </span>

                            <span className="text-lg font-black text-amber-300">

                                {currentQuestionIndex +
                                    1}

                                <span className="text-purple-400/60 font-medium text-sm">

                                    {" "}
                                    /
                                    {
                                        gameData
                                            .questions
                                            ?.length ||
                                        10
                                    }

                                </span>

                            </span>

                        </div>

                        <div className="flex flex-col items-end">

                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                                Your Score
                            </span>

                            <span className="text-lg font-black text-amber-300 flex items-center gap-1">

                                <FaTrophy />

                                {currentPlayer?.score ||
                                    0}

                            </span>

                        </div>

                    </div>

                    {/* =================================================
                        QUESTION
                    ================================================= */}

                    <div className="text-center my-4 sm:my-6">

                        <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed tracking-wide">
                            {questionText}
                        </h2>

                        <div className="flex items-center justify-center space-x-2 text-purple-400/50 my-3">

                            <span className="w-8 h-0.5 bg-purple-500/30" />

                            <FaStar className="text-amber-400 text-xs" />

                            <span className="w-8 h-0.5 bg-purple-500/30" />

                        </div>

                    </div>

                    {/* =================================================
                        ANSWER OPTIONS
                    ================================================= */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">

                        {shuffledOptions.map(
                            (
                                option,
                                idx
                            ) => {

                                const kahootShapes =
                                    [
                                        {
                                            shape: "▲",
                                            badge: "bg-[#e21b3c] text-white",
                                            cardDefault:
                                                "bg-[#e21b3c]/15 hover:bg-[#e21b3c]/25 border-[#e21b3c]/40 text-white",
                                        },
                                        {
                                            shape: "◆",
                                            badge: "bg-[#1368ce] text-white",
                                            cardDefault:
                                                "bg-[#1368ce]/15 hover:bg-[#1368ce]/25 border-[#1368ce]/40 text-white",
                                        },
                                        {
                                            shape: "●",
                                            badge: "bg-[#d89e00] text-slate-950 font-black",
                                            cardDefault:
                                                "bg-[#d89e00]/15 hover:bg-[#d89e00]/25 border-[#d89e00]/40 text-white",
                                        },
                                        {
                                            shape: "■",
                                            badge: "bg-[#26890c] text-white",
                                            cardDefault:
                                                "bg-[#26890c]/15 hover:bg-[#26890c]/25 border-[#26890c]/40 text-white",
                                        },
                                    ];

                                const shapeMeta =
                                    kahootShapes[
                                        idx %
                                            kahootShapes.length
                                    ];

                                const isSelected =
                                    selectedAnswer ===
                                    option;

                                const isCorrectAnswer =
                                    option ===
                                    correctOption;

                                let btnStyle =
                                    shapeMeta.cardDefault;

                                let badgeStyle =
                                    shapeMeta.badge;

                                if (
                                    isAnswerRevealed
                                ) {
                                    if (
                                        isCorrectAnswer
                                    ) {
                                        btnStyle =
                                            "bg-emerald-950/90 border-2 border-emerald-400 text-white shadow-[0_0_25px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400/40";

                                        badgeStyle =
                                            "bg-emerald-400 text-black";
                                    } else if (
                                        isSelected &&
                                        !isCorrectAnswer
                                    ) {
                                        btnStyle =
                                            "bg-rose-950/90 border-2 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)]";

                                        badgeStyle =
                                            "bg-rose-500 text-white";
                                    } else {
                                        btnStyle =
                                            "bg-[#1b113e]/40 border-purple-900/30 text-purple-400/40 opacity-40";

                                        badgeStyle =
                                            "bg-purple-900/40 text-purple-400";
                                    }
                                } else if (
                                    isSelected
                                ) {
                                    btnStyle =
                                        "bg-[#261b55] border-2 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.35)] ring-2 ring-amber-400/30";

                                    badgeStyle =
                                        "bg-amber-400 text-black";
                                }

                                return (
                                    <button
                                        key={`${currentQuestionIndex}-${option}`}
                                        type="button"
                                        onClick={() =>
                                            handleAnswer(
                                                option
                                            )
                                        }
                                        disabled={
                                            submitted ||
                                            timeLeft ===
                                                0 ||
                                            isAnswerRevealed
                                        }
                                        className={`w-full min-h-[64px] flex items-center justify-between p-3.5 sm:p-4 rounded-2xl font-bold transition-all duration-200 text-left border cursor-pointer active:scale-[0.98] ${btnStyle} ${
                                            submitted ||
                                            timeLeft ===
                                                0 ||
                                            isAnswerRevealed
                                                ? "cursor-default active:scale-100"
                                                : ""
                                        }`}
                                    >

                                        <div className="flex items-center space-x-3 min-w-0">

                                            <div
                                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${badgeStyle}`}
                                            >
                                                {
                                                    shapeMeta.shape
                                                }
                                            </div>

                                            <span className="text-sm sm:text-base font-bold truncate">
                                                {
                                                    option
                                                }
                                            </span>

                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">

                                            {isAnswerRevealed &&
                                                isCorrectAnswer && (
                                                    <span className="text-[10px] bg-emerald-400 text-black font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1">

                                                        <FaCheck />

                                                        CORRECT

                                                    </span>
                                                )}

                                            {isAnswerRevealed &&
                                                isSelected &&
                                                !isCorrectAnswer && (
                                                    <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded shadow-sm flex items-center gap-1">

                                                        <FaTimes />

                                                        WRONG

                                                    </span>
                                                )}

                                            {!isAnswerRevealed && (
                                                <div
                                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? "border-amber-400 bg-amber-400 text-black"
                                                            : "border-purple-600/40 bg-purple-950/20"
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <FaCheck className="text-[10px]" />
                                                    )}
                                                </div>
                                            )}

                                        </div>

                                    </button>
                                );
                            }
                        )}

                    </div>

                    {/* =================================================
                        SUBMIT
                    ================================================= */}

                    {!isAnswerRevealed && (
                        <button
                            type="button"
                            onClick={
                                submitAnswer
                            }
                            disabled={
                                selectedAnswer ===
                                    "" ||
                                submitted ||
                                timeLeft === 0
                            }
                            className="w-full mt-2 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-slate-950 font-black py-3.5 sm:py-4 px-6 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.4)] text-base sm:text-lg tracking-wide flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-yellow-200/40"
                        >

                            <FaRocket />

                            <span>
                                {submitted
                                    ? "ANSWER SUBMITTED"
                                    : timeLeft ===
                                      0
                                    ? "TIME EXPIRED"
                                    : "SUBMIT ANSWER"}
                            </span>

                        </button>
                    )}

                    {/* =================================================
                        FEEDBACK
                    ================================================= */}

                    {isAnswerRevealed ? (
                        <div
                            className={`mt-4 text-center text-xs sm:text-sm font-extrabold py-3 px-4 rounded-2xl border ${
                                !submitted
                                    ? "text-amber-300 bg-amber-950/60 border-amber-500/40"
                                    : isCorrect
                                    ? "text-emerald-300 bg-emerald-950/70 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                                    : "text-rose-300 bg-rose-950/70 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            }`}
                        >

                            {!submitted ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaClock />
                                    Time's up! You did not submit an answer in time.
                                </span>
                            ) : isCorrect ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FaCheck />
                                    Great job! Your answer is Correct!
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <FaTimes />
                                    Oops! Your answer was Incorrect.
                                </span>
                            )}

                        </div>
                    ) : submitted ? (
                        <div className="mt-4 flex items-center justify-center space-x-2 text-xs sm:text-sm font-semibold text-purple-300">

                            <FaClock />

                            <span>
                                Answer locked in! Waiting for host /
                                timer...
                            </span>

                        </div>
                    ) : null}

                    {/* =================================================
                        ANSWER STATISTICS
                    ================================================= */}

                    {isAnswerRevealed && (
                        <div className="mt-4 flex items-center justify-center gap-3">

                            <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-bold text-emerald-300 shadow-sm">

                                <FaCheck />

                                <span>
                                    {
                                        correctAnswersCount
                                    }{" "}
                                    Correct
                                </span>

                            </div>

                            <div className="flex items-center gap-1.5 bg-rose-950/70 border border-rose-500/40 px-3.5 py-1 rounded-full text-xs font-bold text-rose-300 shadow-sm">

                                <FaTimes />

                                <span>
                                    {
                                        wrongAnswersCount
                                    }{" "}
                                    Wrong
                                </span>

                            </div>

                        </div>
                    )}

                </div>
            </div>

            {/* =================================================
                BOTTOM PLAYERS BAR
            ================================================= */}

            {gameData.players &&
                gameData.players.length >
                    0 && (
                    <div className="w-full max-w-4xl z-20 mt-4">

                        <div className="bg-[#120a2e]/90 border border-purple-800/60 rounded-2xl p-3 backdrop-blur-md flex items-center space-x-3 overflow-x-auto custom-scrollbar">

                            {gameData.players.map(
                                (
                                    player,
                                    idx
                                ) => {

                                    const isCurrent =
                                        player.id ===
                                        currentPlayer?.id;

                                    const avatar =
                                        avatars[
                                            idx %
                                                avatars.length
                                        ];

                                    return (
                                        <div
                                            key={
                                                player.id ||
                                                idx
                                            }
                                            className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl border transition-all ${
                                                isCurrent
                                                    ? "bg-purple-900/90 border-2 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] relative"
                                                    : "bg-[#1b113e]/70 border-purple-800/40 text-purple-200"
                                            }`}
                                        >

                                            {isCurrent && (
                                                <span className="absolute -top-2.5 left-3 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                                    YOU
                                                </span>
                                            )}

                                            <span className="text-lg text-purple-300">

                                                {
                                                    avatar
                                                }

                                            </span>

                                            <div className="flex flex-col">

                                                <span className="text-xs font-bold text-white leading-tight">
                                                    {
                                                        player.nickname
                                                    }
                                                </span>

                                                <span className="text-[11px] font-black text-amber-300">
                                                    {
                                                        player.score ||
                                                        0
                                                    }
                                                </span>

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    </div>
                )}

        </div>
    );
}

export default GameScreen;