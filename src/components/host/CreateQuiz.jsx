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

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) return;
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

    try {
      const quizId = "quiz_" + Date.now();
      const quizData = { quizId, title, questions };
      dispatch(setQuiz(quizData));
      await setDoc(doc(db, "quizzes", quizId), quizData);

      alert(`Quiz saved successfully! Game PIN / Quiz ID: ${quizId}`);
    } catch (error) {
      console.error("Error saving quiz: ", error);
      alert("Failed to save quiz.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Quiz (Host)</h2>
      
      <div className="mb-4">
        <label className="block font-semibold mb-1">Quiz Title</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title..."
        />
      </div>

      <hr className="my-4" />

      <h3 className="text-lg font-semibold mb-2">Add Question</h3>
      <div className="mb-3">
        <input
          type="text"
          className="w-full p-2 border rounded mb-2"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Question text..."
        />
        {options.map((opt, idx) => (
          <input
            key={idx}
            type="text"
            className="w-full p-2 border rounded mb-2"
            value={opt}
            onChange={(e) => handleOptionChange(idx, e.target.value)}
            placeholder={`Option ${idx + 1}`}
          />
        ))}
        <div className="flex gap-4 mb-2">
          <div>
            <label className="text-sm font-medium">Correct Option (0-3): </label>
            <input
              type="number"
              min="0"
              max="3"
              className="p-1 border rounded w-16"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Timer (secs): </label>
            <input
              type="number"
              className="p-1 border rounded w-16"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={handleAddQuestion}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full mb-4"
        >
          Add Question to List ({questions.length} added)
        </button>
      </div>

      <button
        onClick={handleSaveQuiz}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full font-bold"
      >
        Save Quiz to Firebase 🚀
      </button>
    </div>
  );
}