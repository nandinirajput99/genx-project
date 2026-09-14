import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";

import {
  setGame,
  setCurrentQuestionIndex,
  setAnswerRevealed,
} from "../../redux/gameSlice";

import { setPlayers } from "../../redux/playersSlice";
import Podium from "../common/Podium";

export default function LiveHost() {
  const dispatch = useDispatch();

  const game = useSelector((state) => state.game);
  const players = useSelector((state) => state.players.players);

  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [status, setStatus] = useState("waiting");

  /*
  =====================================================
  1. LISTEN TO LIVE GAME FROM FIREBASE
  =====================================================
  */

  useEffect(() => {
    if (!game.pin) return;

    const gameRef = doc(db, "games", game.pin);

    const unsubscribe = onSnapshot(
      gameRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          console.log("Game does not exist");
          return;
        }

        const data = docSnap.data();

        // Questions
        if (data.questions) {
          setQuestions(data.questions);
        }

        // Players
        if (data.players) {
          dispatch(setPlayers(data.players));
        }

        // Game state
        if (data.status) {
          setStatus(data.status);
        }

        // Keep Redux game state synchronized
        dispatch(
          setGame({
            ...data,
            gameId: data.gameId || game.pin,
            pin: data.pin || game.pin,
          })
        );

        // Sync answer revealed state
        dispatch(setAnswerRevealed(Boolean(data.answerRevealed)));

        /*
          If question has already started,
          calculate the remaining time.
        */

        if (data.questionStartedAt) {
          const duration = data.questionDuration || 20;

          const startedAt =
            typeof data.questionStartedAt === "number"
              ? data.questionStartedAt
              : data.questionStartedAt.toMillis();

          const elapsed = Math.floor((Date.now() - startedAt) / 1000);

          const remaining = Math.max(0, duration - elapsed);

          setTimeLeft(remaining);
          setIsTimerActive(
            remaining > 0 &&
              data.status === "playing" &&
              !data.answerRevealed
          );
        } else {
          setTimeLeft(data.questionDuration || 20);
          setIsTimerActive(false);
        }
      },
      (error) => {
        console.error("Game listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [game.pin, dispatch]);

  /*
  =====================================================
  2. CURRENT QUESTION
  =====================================================
  */

  const currentQuestionIndex = game.currentQuestionIndex || 0;

  const currentQ = questions[currentQuestionIndex] || {};

  const questionText =
    currentQ.questionText ||
    (typeof currentQ.question === "object"
      ? currentQ.question?.text
      : currentQ.question) ||
    "Loading question...";

  const questionDuration = currentQ.timer || 20;

  /*
  =====================================================
  3. TIMER
  =====================================================
  */

  useEffect(() => {
    if (!game.pin) return;

    if (!isTimerActive || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, game.pin]);

  /*
  =====================================================
  4. AUTO REVEAL WHEN TIMER ENDS
  =====================================================
  */

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (!isTimerActive) return;
    if (!game.pin) return;
    if (game.answerRevealed) return;

    const revealAnswer = async () => {
      try {
        setIsTimerActive(false);

        const gameRef = doc(db, "games", game.pin);

        /*
          IMPORTANT:

          We DO NOT calculate scores here.

          GameScreen already handles scoring using
          Firestore transaction.

          Host only reveals the answer.
        */

        await updateDoc(gameRef, {
          answerRevealed: true,
        });

        dispatch(setAnswerRevealed(true));
      } catch (error) {
        console.error("Error revealing answer:", error);
      }
    };

    revealAnswer();
  }, [
    timeLeft,
    isTimerActive,
    game.pin,
    game.answerRevealed,
    dispatch,
  ]);

  /*
  =====================================================
  5. START CURRENT QUESTION
  =====================================================
  */

  const handleStartQuestionTimer = async () => {
    if (!game.pin || !currentQ) return;

    try {
      const duration = currentQ.timer || 20;

      const startedAt = Date.now();

      const gameRef = doc(db, "games", game.pin);

      await updateDoc(gameRef, {
        status: "playing",
        questionStartedAt: startedAt,
        questionDuration: duration,
        answerRevealed: false,
      });

      setTimeLeft(duration);
      setIsTimerActive(true);

      dispatch(setAnswerRevealed(false));
    } catch (error) {
      console.error("Error starting question:", error);
    }
  };

  /*
  =====================================================
  6. NEXT QUESTION / REVEAL
  =====================================================
  */

  const handleNextQuestion = async () => {
    if (!game.pin) return;

    const gameRef = doc(db, "games", game.pin);

    /*
      If answer is NOT revealed yet,
      first reveal the answer.
    */

    if (!game.answerRevealed) {
      try {
        await updateDoc(gameRef, {
          answerRevealed: true,
        });

        setIsTimerActive(false);
        dispatch(setAnswerRevealed(true));
      } catch (error) {
        console.error("Error revealing answer:", error);
      }

      return;
    }

    /*
      Answer is already revealed.
      Now move to next question.
    */

    const nextIndex = currentQuestionIndex + 1;

    /*
      QUIZ FINISHED
    */

    if (nextIndex >= questions.length) {
      try {
        await updateDoc(gameRef, {
          status: "finished",
          questionStartedAt: null,
          answerRevealed: true,
        });

        setIsTimerActive(false);
        setStatus("finished");
      } catch (error) {
        console.error("Error finishing quiz:", error);
      }

      return;
    }

    /*
      NEXT QUESTION
    */

    try {
      const nextQuestion = questions[nextIndex];

      const nextDuration = nextQuestion?.timer || 20;

      /*
        Reset only answer-related player data.

        Scores and streaks remain.
      */

      const resetPlayers = players.map((player) => ({
        ...player,
        answer: "",
        answered: false,
        correct: null,
        timeRemaining: null,
        scoredForQuestion: null,
      }));

      await updateDoc(gameRef, {
        currentQuestionIndex: nextIndex,
        answerRevealed: false,
        questionStartedAt: null,
        questionDuration: nextDuration,
        players: resetPlayers,
      });

      dispatch(setCurrentQuestionIndex(nextIndex));
      dispatch(setAnswerRevealed(false));

      setTimeLeft(nextDuration);
      setIsTimerActive(false);
    } catch (error) {
      console.error("Error moving to next question:", error);
    }
  };

  /*
  =====================================================
  7. SORT LEADERBOARD
  =====================================================
  */

  const sortedPlayers = [...players].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  );

  /*
  =====================================================
  8. FINISHED SCREEN
  =====================================================
  */

  if (status === "finished") {
    return (
      <Podium
        winners={sortedPlayers.map((player) => ({
          name: player.nickname,
          score: player.score || 0,
        }))}
      />
    );
  }

  /*
  =====================================================
  9. HOST UI
  =====================================================
  */

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 select-none overflow-x-hidden">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}

        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Question {currentQuestionIndex + 1} of{" "}
                {questions.length}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Game PIN:{" "}
                <span className="font-bold text-indigo-600">
                  {game.pin}
                </span>
              </p>
            </div>

            {/* TIMER */}

            <div
              className={`px-5 py-3 rounded-full font-bold text-lg ${
                timeLeft <= 5
                  ? "bg-red-100 text-red-700"
                  : "bg-indigo-100 text-indigo-700"
              }`}
            >
              ⏳ {timeLeft}s
            </div>
          </div>
        </div>

        {/* QUESTION */}

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

          <h3 className="text-2xl font-bold text-center text-gray-800 mb-8">
            {questionText}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {currentQ.options?.map((option, index) => {
              const isCorrect =
                index === currentQ.correctAnswer;

              return (
                <div
                  key={index}
                  className={`p-5 rounded-xl font-semibold text-white text-center ${
                    isCorrect
                      ? "bg-green-600"
                      : "bg-indigo-500"
                  }`}
                >
                  <span className="mr-2">
                    {String.fromCharCode(65 + index)}.
                  </span>

                  {option}
                </div>
              );
            })}

          </div>
        </div>

        {/* CONTROLS */}

        <div className="bg-white rounded-2xl shadow-md p-5 mb-6">

          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <button
              onClick={handleStartQuestionTimer}
              disabled={
                isTimerActive ||
                !currentQ.options?.length ||
                status !== "playing"
              }
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTimerActive
                ? `Question Running (${timeLeft}s)`
                : "Start Question ⏱️"}
            </button>

            <button
              onClick={handleNextQuestion}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700"
            >
              {game.answerRevealed
                ? currentQuestionIndex + 1 >= questions.length
                  ? "Finish Quiz 🏆"
                  : "Next Question ➡️"
                : "Reveal Answer 👁️"}
            </button>

          </div>

        </div>

        {/* LEADERBOARD */}

        <div className="bg-white rounded-2xl shadow-md p-5">

          <div className="flex justify-between items-center mb-5">

            <h4 className="text-xl font-bold text-gray-800">
              Live Leaderboard 📊
            </h4>

            <span className="text-sm text-gray-500">
              {players.length} Players
            </span>

          </div>

          {sortedPlayers.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No players have joined yet.
            </p>
          ) : (
            <ul className="space-y-3">

              {sortedPlayers.map((player, index) => (

                <li
                  key={player.id || index}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-xl"
                >

                  <div className="flex items-center gap-3">

                    <span className="font-bold text-gray-500">
                      #{index + 1}
                    </span>

                    <div>
                      <p className="font-bold text-gray-800">
                        {player.nickname}
                      </p>

                      {player.streak > 0 && (
                        <p className="text-sm text-orange-500">
                          🔥 {player.streak} streak
                        </p>
                      )}
                    </div>

                  </div>

                  <span className="font-bold text-indigo-600">
                    {player.score || 0} pts
                  </span>

                </li>

              ))}

            </ul>
          )}

        </div>

      </div>
    </div>
  );
}