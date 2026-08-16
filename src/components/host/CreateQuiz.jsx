import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { setQuiz } from "../../redux/quizSlice";
import { db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CreateQuiz() {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [timer, setTimer] = useState(20);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      alert("Please enter question text!");
      return;
    }
    const newQ = {
      questionText,
      options,
      correctAnswer: Number(correctAnswer),
      timer: Number(timer)
    };
    setQuestions([...questions, newQ]);
    setQuestionText("");
    setOptions(["", "", "", ""]);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || questions.length === 0) {
      alert("Please add a title and at least one question!");
      return;
    }

    setLoading(true);
    try {
      const quizId = "quiz_" + Date.now();
      const quizData = { quizId, title, questions };

      dispatch(setQuiz(quizData));
      await setDoc(doc(db, "quizzes", quizId), quizData);

      alert(`Quiz saved successfully! Game PIN / Quiz ID: ${quizId}`);
    } catch (error) {
      console.error("Error saving quiz: ", error);
      alert("Failed to save quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10 border border-indigo-100">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-indigo-600">Create Quiz (Host) 🎯</h2>
      
      <div className="mb-5">
        <label className="block font-bold mb-2 text-gray-700">Quiz Title</label>
        <input
          type="text"
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title..."
        />
      </div>

      <hr className="my-6 border-gray-200" />

      <h3 className="text-xl font-bold mb-3 text-gray-800">Add Question</h3>
      <div className="space-y-3 mb-5">
        <input
          type="text"
          className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Type your question here..."/>
        {options.map((opt, idx) => (
          <input
            key={idx}
            type="text"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none"
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`} />
        ))}
        <div className="flex gap-4 mb-3">
          <div className="flex-1">
            <label className="text-sm font-bold text-gray-600">Correct Option (0-3)</label>
            <input
              type="number"
              min="0"
              max="3"
              className="w-full p-2 border-2 border-gray-200 rounded-xl mt-1"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}/>
          </div>
          <div className="flex-1">
            <label className="text-sm font-bold text-gray-600">Timer (secs)</label>
            <input
              type="number"
              className="w-full p-2 border-2 border-gray-200 rounded-xl mt-1"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}/>
          </div>
        </div>
        <button
          onClick={handleAddQuestion}
          className="w-full bg-indigo-500 text-white font-bold p-3 rounded-xl hover:bg-indigo-600 transition shadow-md">
            + Add Question 
          ({questions.length} added)
        </button>
      </div>

      <button
        onClick={handleSaveQuiz}
        disabled={loading}
        className="w-full bg-green-600 text-white font-extrabold p-3 rounded-xl hover:bg-green-700 transition shadow-lg text-lg">
        {loading ? "Saving..." : "Save Quiz to Firebase 🚀"}
      </button>
    </div>
  );
}