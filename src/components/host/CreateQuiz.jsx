import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchQuestions,addQuestion } from "../../redux/quizSlice";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

function CreateQuiz() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { questions, loading, error } = useSelector(
    (state) => state.quiz
  );

  const previousQuestionCount = useRef(0);

  // 🔊 Sound of Joy
  const playSoundOfJoy = () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const ctx = new AudioContext();

      const playNote = (
        freq,
        startTime,
        duration,
        type = "triangle"
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(
          0.2,
          startTime + 0.05
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          startTime + duration
        );

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;

      // 🎵 Joyous arpeggio
      playNote(261.63, now, 0.3, "triangle");
      playNote(329.63, now + 0.1, 0.3, "triangle");
      playNote(392.0, now + 0.2, 0.3, "triangle");
      playNote(523.25, now + 0.3, 0.5, "sine");

      // 🎺 Cheerful fanfare
      playNote(392.0, now + 0.5, 0.2, "sawtooth");
      playNote(523.25, now + 0.7, 0.6, "sine");

      // 🎶 Warm chord
      playNote(329.63, now + 0.7, 0.6, "sine");
      playNote(659.25, now + 0.7, 0.6, "sine");
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  // 🔊 Play sound when questions are successfully loaded
  useEffect(() => {
    if (
      questions.length > 0 &&
      previousQuestionCount.current === 0
    ) {
      playSoundOfJoy();
    }

    previousQuestionCount.current = questions.length;
  }, [questions.length]);

  const handleFetchQuestions = () => {
    dispatch(fetchQuestions());
  };
  // 👇 Custom question ke liye states
  const [mode, setMode] = useState("fetch"); // "fetch" ya "custom"
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [customOptions, setCustomOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const handleOptionChange = (index, value) => {
    const updated = [...customOptions];
    updated[index] = value;
    setCustomOptions(updated);
  };

  const handleAddCustomQuestion = () => {
    if (!customQuestionText.trim() || customOptions.some((o) => !o.trim())) {
      alert("Please fill the question and all 4 options!");
      return;
    }

    const correctAnswerText = customOptions[correctIndex];
    const incorrectAnswers = customOptions.filter((_, i) => i !== correctIndex);

    const newQuestion = {
      id: "custom_" + Date.now(),
      question: { text: customQuestionText },
      incorrectAnswers: incorrectAnswers,
      correctAnswer: correctAnswerText,
    };

    dispatch(addQuestion(newQuestion));

    setCustomQuestionText("");
    setCustomOptions(["", "", "", ""]);
    setCorrectIndex(0);

    playSoundOfJoy();
  };

  const handleHostQuiz = async () => {
    if (questions.length === 0) return;

    const formattedQuestions = questions.map((q) => {
      const options = [
        ...q.incorrectAnswers,
        q.correctAnswer,
      ];

      return {
        id: q.id,
        question: q.question.text,
        questionText: q.question.text,
        options: options,
        correctAnswer: options.length - 1,
      };
    });

    try {
      await setDoc(doc(db, "quizzes", "default_quiz"), {
        questions: formattedQuestions,
      });

      // 🎉 Host quiz success sound
      playSoundOfJoy();

      navigate("/host/lobby");
    } catch (err) {
      console.error("Error hosting quiz:", err);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-950 via-purple-900 to-slate-950 px-4 py-8 sm:px-6 lg:px-8">

      {/* Main Container */}
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-200 backdrop-blur-md">
            🎮 Quiz Battle
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Create Quiz
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Fetch exciting questions, prepare your quiz and
            invite players to battle! 🧠⚡
          </p>
        </div>

        {/* Control Card */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            {/* Question Info */}
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Quiz Questions
              </p>

              <div className="mt-1 flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-3xl font-black text-white">
                  {questions.length}
                </span>

                <span className="text-sm text-slate-400">
                  questions ready
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={handleFetchQuestions}
                disabled={loading}
                className="group rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-400 hover:to-indigo-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🔄</span>
                      Fetch Questions
                    </>
                  )}
                </span>
              </button>

              {questions.length > 0 && (
                <button
                  onClick={handleHostQuiz}
                  className="group rounded-xl bg-linear-to-r from-emerald-500 to-green-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-green-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-500 active:translate-y-0"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-lg transition-transform duration-200 group-hover:rotate-12">
                      🚀
                    </span>
                    Start Lobby & Host
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Mode Toggle */}
        <div className="mb-6 flex justify-center gap-3">
          <button
            onClick={() => setMode("fetch")}
            className={`rounded-full px-5 py-2 font-bold text-sm transition ${
              mode === "fetch"
                ? "bg-indigo-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            🔄 Fetch from API
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`rounded-full px-5 py-2 font-bold text-sm transition ${
              mode === "custom"
                ? "bg-indigo-500 text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            ✍️ Add Your Own
          </button>
        </div>

        {/* Custom Question Form */}
        {mode === "custom" && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-4 text-lg font-black text-white">Add Your Own Question</h3>

            <input
              type="text"
              value={customQuestionText}
              onChange={(e) => setCustomQuestionText(e.target.value)}
              placeholder="Type your question..."
              className="mb-3 w-full rounded-xl border border-white/20 bg-slate-950/40 p-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400"
            />

            {customOptions.map((opt, idx) => (
              <div key={idx} className="mb-2 flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                  className="h-4 w-4 accent-emerald-500"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full rounded-xl border border-white/20 bg-slate-950/40 p-3 text-white placeholder-slate-400 outline-none focus:border-indigo-400"
                />
              </div>
            ))}

            <p className="mb-3 text-xs text-slate-400">👆 Radio button se sahi answer select karo</p>

            <button
              onClick={handleAddCustomQuestion}
              className="w-full rounded-xl bg-linear-to-r from-purple-500 to-indigo-600 px-6 py-3 font-bold text-white hover:from-purple-400 hover:to-indigo-500"
            >
              ➕ Add Question to Quiz
            </button>
          </div>
        )}

       

        {/* Loading */}
        {loading && (
          <div className="mb-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5 text-center backdrop-blur-md">
            <div className="flex items-center justify-center gap-3 text-blue-200">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300/30 border-t-blue-300" />
              <span className="font-semibold">
                Preparing awesome questions...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-center backdrop-blur-md">
            <p className="font-semibold text-red-200">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && questions.length === 0 && !error && (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-14 text-center backdrop-blur-md">

            <div className="mb-4 text-6xl">
              🧠
            </div>

            <h2 className="text-2xl font-black text-white">
              Your quiz is waiting!
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Click <span className="font-bold text-blue-300">Fetch Questions</span>
              to load questions and start building your Quiz Battle.
            </p>
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-6">

            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Question Preview
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Review your questions before starting the lobby.
                </p>
              </div>

              <div className="hidden rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300 sm:block">
                {questions.length} Questions
              </div>
            </div>

           
             
           {questions.map((question, index) => {
  const options = [...question.incorrectAnswers, question.correctAnswer];

  return (
    <div
      key={question.id}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-color-white/[0.13]"
    >
      {/* Question Header */}
      <div className="flex items-start gap-4 border-b border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-black text-white shadow-lg">
          {index + 1}
        </div>

        <div className="flex-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-300">
            Question {index + 1}
          </p>

          <h3 className="text-base font-bold leading-7 text-white sm:text-lg">
            {question.question.text}
          </h3>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        {options.map((option, optionIndex) => (
          <div
            key={`${question.id}-${optionIndex}`}
            className="group/option flex min-h-64px items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition-all duration-200 hover:border-indigo-400/40 hover:bg-indigo-500/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-black text-indigo-300">
              {String.fromCharCode(65 + optionIndex)}
            </span>

            <span className="text-sm font-semibold leading-5 text-slate-200">
              {option}
            </span>
          </div>
        ))}
      </div>

      {/* Question Footer */}
      <div className="border-t border-white/10 bg-black/10 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>💡</span>
          <span>Choose the correct answer during the live game.</span>
        </div>
      </div>
    </div>
  );
})}
          </div>
        )}
        {questions.length > 0 && (
          <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-linear-to-r from-emerald-500/10 to-blue-500/10 p-6 text-center backdrop-blur-xl">

            <div className="mb-2 text-3xl">
              🎉
            </div>

            <h3 className="text-xl font-black text-white">
              Ready for the Battle?
            </h3>

            <p className="mt-1 mb-5 text-sm text-slate-400">
              Start the lobby and let your players join the quiz.
            </p>

            <button
              onClick={handleHostQuiz}
              className="rounded-xl bg-linear-to-r from-emerald-500 to-green-600 px-8 py-3.5 font-black text-white shadow-lg shadow-green-900/30 transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-400 hover:to-green-500"
            >
              🚀 Start Lobby & Host
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default CreateQuiz;
