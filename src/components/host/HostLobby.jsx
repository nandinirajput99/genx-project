import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

import {
  setGame,
  setGameStatus,
  resetGame,
} from "../../redux/gameSlice";

import {
  setPlayers,
  clearPlayers,
} from "../../redux/playersSlice";

import {
  setQuiz,
} from "../../redux/quizSlice";


// --------------------------------------------------
// Generate 6 Digit Game PIN
// --------------------------------------------------

const generateGamePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// --------------------------------------------------
// HostLobby Component
// --------------------------------------------------

const HostLobby = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { quizId: routeQuizId } = useParams();

  const reduxQuizId = useSelector((state) => state.quiz.quizId);
  const reduxQuizTitle = useSelector((state) => state.quiz.title);
  const reduxQuestions = useSelector((state) => state.quiz.questions);

  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [quizData, setQuizData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);

  const [error, setError] = useState("");

  const [gameCreated, setGameCreated] = useState(false);

  const [copied, setCopied] = useState(false);


  // --------------------------------------------------
  // Decide Quiz ID
  // --------------------------------------------------

  const activeQuizId =
    routeQuizId ||
    reduxQuizId ||
    localStorage.getItem("selectedQuizId");


  // --------------------------------------------------
  // Fetch Quiz
  // --------------------------------------------------

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError("");

        if (!activeQuizId) {
          throw new Error("Quiz ID not found.");
        }

        // First try Redux data
        if (
          reduxQuestions &&
          reduxQuestions.length > 0 &&
          reduxQuizId === activeQuizId
        ) {
          const localQuiz = {
            id: activeQuizId,
            title: reduxQuizTitle || "Untitled Quiz",
            questions: reduxQuestions,
          };

          setQuizData(localQuiz);

          setLoading(false);
          return;
        }

        // Otherwise fetch from Firestore
        const quizRef = doc(db, "quizzes", activeQuizId);

        const quizSnap = await getDoc(quizRef);

        if (!quizSnap.exists()) {
          throw new Error("Quiz not found in Firestore.");
        }

        const data = quizSnap.data();

        const loadedQuiz = {
          id: quizSnap.id,
          ...data,
          questions: Array.isArray(data.questions)
            ? data.questions
            : [],
        };

        setQuizData(loadedQuiz);

        // Also store quiz in Redux
        dispatch(
          setQuiz({
            quizId: quizSnap.id,
            title: loadedQuiz.title || "Untitled Quiz",
            questions: loadedQuiz.questions,
          })
        );

      } catch (err) {
        console.error("Quiz loading error:", err);

        setError(
          err.message || "Unable to load quiz."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [
    activeQuizId,
    reduxQuizId,
    reduxQuizTitle,
    reduxQuestions,
    dispatch,
  ]);


  // --------------------------------------------------
  // Create Live Game
  // --------------------------------------------------

  const createLiveGame = async () => {
    try {
      setCreatingGame(true);
      setError("");

      if (!quizData) {
        throw new Error("Quiz data is not available.");
      }

      if (
        !quizData.questions ||
        quizData.questions.length === 0
      ) {
        throw new Error(
          "This quiz does not contain any questions."
        );
      }

      // Generate unique live game PIN
      let generatedPin = "";

      let existingGame = true;

      // Try until unused PIN is found
      while (existingGame) {
        generatedPin = generateGamePin();

        const gameRef = doc(
          db,
          "games",
          generatedPin
        );

        const gameSnap = await getDoc(gameRef);

        existingGame = gameSnap.exists();
      }

      const gameRef = doc(
        db,
        "games",
        generatedPin
      );

      // Initial live game object
      const newGame = {
        gameId: generatedPin,

        pin: generatedPin,

        quizId: quizData.id,

        title: quizData.title || "Quiz",

        status: "waiting",

        currentQuestionIndex: 0,

        questionStartedAt: null,

        questionDuration: 30,

        answerRevealed: false,

        questions: quizData.questions,

        players: [],

        createdAt: Date.now(),

        hostConnected: true,
      };

      await setDoc(gameRef, newGame);

      // Save game in Redux
      dispatch(
        setGame({
          gameId: generatedPin,
          pin: generatedPin,
          quizId: quizData.id,
          title: quizData.title || "Quiz",
          status: "waiting",
          currentQuestionIndex: 0,
          questionStartedAt: null,
          questionDuration: 30,
          answerRevealed: false,
          players: [],
          questions: quizData.questions,
        })
      );

      // Save selected game information locally
      localStorage.setItem(
        "hostGamePin",
        generatedPin
      );

      localStorage.setItem(
        "hostQuizId",
        quizData.id
      );

      setGameCreated(true);

    } catch (err) {
      console.error("Game creation error:", err);

      setError(
        err.message ||
        "Failed to create live game."
      );
    } finally {
      setCreatingGame(false);
    }
  };


  // --------------------------------------------------
  // Listen for Real-Time Game Updates
  // --------------------------------------------------

  useEffect(() => {
    if (!gameCreated || !game.pin) {
      return;
    }

    const gameRef = doc(
      db,
      "games",
      game.pin
    );

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("Live game no longer exists.");
          return;
        }

        const data = snapshot.data();

        // ------------------------------------------
        // Update Redux Game
        // ------------------------------------------

        dispatch(
          setGame({
            ...data,
            gameId: snapshot.id,
            pin: data.pin || snapshot.id,
          })
        );


        // ------------------------------------------
        // Update Redux Players
        // ------------------------------------------

        const updatedPlayers =
          Array.isArray(data.players)
            ? data.players
            : [];

        dispatch(
          setPlayers(updatedPlayers)
        );


        // ------------------------------------------
        // If game started
        // ------------------------------------------

        if (data.status === "playing") {
          dispatch(
            setGameStatus("playing")
          );

          navigate("/host/live");
        }


        // ------------------------------------------
        // If game finished
        // ------------------------------------------

        if (data.status === "finished") {
          dispatch(
            setGameStatus("finished")
          );
        }
      },
      (err) => {
        console.error(
          "Game listener error:",
          err
        );

        setError(
          "Unable to sync live game."
        );
      }
    );

    return () => {
      unsubscribe();
    };

  }, [
    gameCreated,
    game.pin,
    dispatch,
    navigate,
  ]);


  // --------------------------------------------------
  // Start Game
  // --------------------------------------------------

  const handleStartGame = async () => {
    try {
      setError("");

      if (!game.pin) {
        setError(
          "Game PIN is not available."
        );
        return;
      }

      if (players.length === 0) {
        setError(
          "At least one player is required to start the game."
        );
        return;
      }

      const gameRef = doc(
        db,
        "games",
        game.pin
      );

      await setDoc(
        gameRef,
        {
          status: "playing",

          currentQuestionIndex: 0,

          questionStartedAt: null,

          answerRevealed: false,

          hostConnected: true,
        },
        {
          merge: true,
        }
      );

      dispatch(
        setGameStatus("playing")
      );

      navigate("/host/live");

    } catch (err) {
      console.error(
        "Start game error:",
        err
      );

      setError(
        err.message ||
        "Unable to start game."
      );
    }
  };


  // --------------------------------------------------
  // Copy PIN
  // --------------------------------------------------

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(
        game.pin
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (err) {
      console.error(
        "Copy error:",
        err
      );
    }
  };


  // --------------------------------------------------
  // Copy Join URL
  // --------------------------------------------------

  const handleCopyJoinLink = async () => {
    try {
      const joinUrl =
        `${window.location.origin}/player/join`;

      await navigator.clipboard.writeText(
        joinUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (err) {
      console.error(
        "Join link copy error:",
        err
      );
    }
  };


  // --------------------------------------------------
  // Leave Lobby
  // --------------------------------------------------

  const handleLeaveLobby = async () => {
    try {
      if (game.pin) {
        const gameRef = doc(
          db,
          "games",
          game.pin
        );

        await setDoc(
          gameRef,
          {
            status: "cancelled",
            hostConnected: false,
          },
          {
            merge: true,
          }
        );
      }

      dispatch(resetGame());
      dispatch(clearPlayers());

      localStorage.removeItem(
        "hostGamePin"
      );

      localStorage.removeItem(
        "hostQuizId"
      );

      navigate("/host");

    } catch (err) {
      console.error(
        "Leave lobby error:",
        err
      );

      navigate("/host");
    }
  };


  // --------------------------------------------------
  // Loading Screen
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-5" />

          <h2 className="text-xl font-bold">
            Loading Quiz...
          </h2>

          <p className="text-slate-400 mt-2">
            Preparing your host lobby
          </p>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Error Screen
  // --------------------------------------------------

  if (error && !quizData && !gameCreated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">

        <div className="w-full max-w-md bg-white/10 border border-white/10 rounded-3xl p-8 text-center">

          <div className="text-5xl mb-5">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold mb-3">
            Something went wrong
          </h2>

          <p className="text-red-300 mb-6">
            {error}
          </p>

          <button
            onClick={() => navigate("/host")}
            className="w-full py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition"
          >
            Back to Host
          </button>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Quiz Loaded But Game Not Created
  // --------------------------------------------------

  if (!gameCreated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-10">

        <div className="max-w-4xl mx-auto">

          {/* Header */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">

            <div>
              <p className="text-sm text-slate-400">
                HOST LOBBY
              </p>

              <h1 className="text-3xl sm:text-4xl font-black mt-1">
                Ready to Host?
              </h1>
            </div>

            <button
              onClick={() => navigate("/host")}
              className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
            >
              ← Back
            </button>

          </div>


          {/* Quiz Card */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">

            <div className="flex flex-col sm:flex-row gap-5 sm:items-center">

              <div className="w-16 h-16 rounded-2xl bg-white text-slate-950 flex items-center justify-center text-3xl font-black shrink-0">
                ?
              </div>

              <div className="flex-1">

                <p className="text-sm text-slate-400">
                  QUIZ
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold">
                  {quizData?.title || "Untitled Quiz"}
                </h2>

                <p className="text-slate-400 mt-2">
                  {quizData?.questions?.length || 0} questions
                </p>

              </div>

            </div>


            {/* Quiz Information */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">

              <div className="bg-black/20 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">
                  Questions
                </p>

                <p className="text-2xl font-bold mt-1">
                  {quizData?.questions?.length || 0}
                </p>
              </div>

              <div className="bg-black/20 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">
                  Mode
                </p>

                <p className="text-2xl font-bold mt-1">
                  Live
                </p>
              </div>

              <div className="bg-black/20 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">
                  Timer
                </p>

                <p className="text-2xl font-bold mt-1">
                  30 sec
                </p>
              </div>

            </div>


            {/* Error */}

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}


            {/* Create Button */}

            <button
              onClick={createLiveGame}
              disabled={creatingGame}
              className="w-full mt-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-lg hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingGame
                ? "Creating Live Game..."
                : "🚀 Create Live Game"}
            </button>

          </div>

        </div>

      </div>
    );
  }


  // --------------------------------------------------
  // Main Lobby UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">


        {/* =========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <div className="flex items-center gap-2 mb-2">

              <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />

              <span className="text-sm font-semibold text-green-300">
                LIVE LOBBY
              </span>

            </div>

            <h1 className="text-2xl sm:text-4xl font-black">
              {quizData?.title || "Quiz Lobby"}
            </h1>

            <p className="text-slate-400 mt-2">
              Waiting for players to join...
            </p>

          </div>


          <button
            onClick={handleLeaveLobby}
            className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition"
          >
            Leave Lobby
          </button>

        </div>


        {/* =========================================
            GAME PIN
        ========================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">


          {/* PIN CARD */}

          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 text-center">

            <p className="text-sm sm:text-base font-semibold text-slate-400 uppercase tracking-widest">
              Join Code
            </p>

            <div className="text-6xl sm:text-8xl font-black tracking-[0.15em] mt-4 mb-6">
              {game.pin}
            </div>

            <p className="text-slate-400 mb-6">
              Ask players to enter this code on the Join Game page.
            </p>


            <div className="flex flex-col sm:flex-row justify-center gap-3">

              <button
                onClick={handleCopyPin}
                className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition"
              >
                {copied
                  ? "✓ Copied"
                  : "Copy PIN"}
              </button>

              <button
                onClick={handleCopyJoinLink}
                className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 font-bold hover:bg-white/20 transition"
              >
                Copy Join Link
              </button>

            </div>

          </div>


          {/* PLAYER COUNT */}

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col justify-between">

            <div>

              <p className="text-sm text-slate-400">
                PLAYERS JOINED
              </p>

              <p className="text-6xl font-black mt-3">
                {players.length}
              </p>

            </div>

            <div className="mt-8">

              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  Lobby status
                </span>

                <span className="text-green-300 font-semibold">
                  Waiting
                </span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden">

                <div
                  className="h-full bg-green-400 transition-all duration-500"
                  style={{
                    width:
                      players.length > 0
                        ? "100%"
                        : "5%",
                  }}
                />

              </div>

            </div>

          </div>

        </div>


        {/* =========================================
            ERROR
        ========================================= */}

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}


        {/* =========================================
            PLAYERS
        ========================================= */}

        <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

            <div>

              <h2 className="text-xl sm:text-2xl font-bold">
                Players
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Players will appear here automatically.
              </p>

            </div>

            <div className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold">
              {players.length} joined
            </div>

          </div>


          {players.length === 0 ? (

            <div className="min-h-[220px] flex flex-col items-center justify-center text-center">

              <div className="text-5xl mb-4">
                👥
              </div>

              <h3 className="text-xl font-bold">
                Waiting for players
              </h3>

              <p className="text-slate-400 mt-2 max-w-md">
                Share the game PIN with your players.
                They will appear here when they join.
              </p>

            </div>

          ) : (

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto pr-1">

              {players.map((player, index) => (

                <div
                  key={player.id || `${player.name}-${index}`}
                  className="bg-black/20 border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition"
                >

                  <div className="w-12 h-12 rounded-full bg-white text-slate-950 flex items-center justify-center mx-auto font-black text-lg">
                    {(
                      player.name ||
                      player.nickname ||
                      "P"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <p className="font-semibold mt-3 truncate">
                    {player.name ||
                      player.nickname ||
                      "Player"}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Player {index + 1}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* =========================================
            START GAME
        ========================================= */}

        <div className="mt-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <h2 className="text-xl sm:text-2xl font-bold">
                Ready to start?
              </h2>

              <p className="text-slate-400 mt-2">
                {players.length === 0
                  ? "Waiting for at least one player..."
                  : `${players.length} player${players.length > 1 ? "s" : ""} ready to play.`}
              </p>

            </div>


            <button
              onClick={handleStartGame}
              disabled={players.length === 0}
              className="w-full lg:w-auto px-10 py-4 rounded-2xl bg-green-400 text-slate-950 font-black text-lg hover:bg-green-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🚀 Start Game
            </button>

          </div>

        </div>


        {/* =========================================
            HOW TO PLAY
        ========================================= */}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

            <div className="text-2xl mb-3">
              1️⃣
            </div>

            <h3 className="font-bold">
              Share the PIN
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              Give players the six-digit game PIN.
            </p>

          </div>


          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

            <div className="text-2xl mb-3">
              2️⃣
            </div>

            <h3 className="font-bold">
              Players Join
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              Players enter their nickname and PIN.
            </p>

          </div>


          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">

            <div className="text-2xl mb-3">
              3️⃣
            </div>

            <h3 className="font-bold">
              Start Quiz
            </h3>

            <p className="text-sm text-slate-400 mt-2">
              Start the game when everyone is ready.
            </p>

          </div>

        </div>


      </div>

    </div>
  );
};

export default HostLobby;