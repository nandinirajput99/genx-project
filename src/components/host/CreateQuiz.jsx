import { useDispatch, useSelector } from "react-redux";
import { fetchQuestions } from "../../redux/quizSlice";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

function CreateQuiz() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { questions, loading, error } = useSelector(
    (state) => state.quiz
  );

  const handleFetchQuestions = () => {
    dispatch(fetchQuestions());
  };

  const handleHostQuiz = async () => {
    if (questions.length === 0) return;

    const formattedQuestions = questions.map((q) => {
      const options = [...q.incorrectAnswers, q.correctAnswer];
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
      navigate("/host/lobby");
    } catch (err) {
      console.error("Error hosting quiz:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10 text-center">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Create Quiz</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={handleFetchQuestions}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg shadow-md"
        >
          Fetch Questions
        </button>

        {questions.length > 0 && (
          <button
            onClick={handleHostQuiz}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-md"
          >
            Start Lobby & Host 🚀
          </button>
        )}
      </div>

      {loading && <p>Loading questions...</p>}

      {error && <p>{error}</p>}

      {questions.map((question, index) => (
        <div
          key={question.id}
          className="bg-white p-5 rounded-xl shadow mb-5"
        >
          <h3 className="text-xl font-bold mb-4">
            {index + 1}. {question.question.text}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              ...question.incorrectAnswers,
              question.correctAnswer,
            ].map((option) => (
              <button
                key={option}
                className="border p-3 rounded-lg hover:bg-blue-100"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CreateQuiz;