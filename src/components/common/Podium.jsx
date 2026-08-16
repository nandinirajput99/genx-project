function Podium({ winners }) {
  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  // Overall correct and wrong answers
  const correctCount = winners.filter(
    (player) => player.correct === true
  ).length;

  const wrongCount = winners.filter(
    (player) => player.answered === true && player.correct === false
  ).length;

  return (
    <div className="min-h-screen bg-linear-to-b from-purple-700 to-purple-900 text-white flex flex-col items-center justify-center p-6">

      {/* Heading */}
      <h1 className="text-4xl font-bold mb-10">
        🏆 Leaderboard 🏆
      </h1>

      {/* Podium */}
      <div className="flex items-end gap-4">

        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold mb-2">
              {second.name}
            </div>

            <div className="text-sm mb-2">
              {second.score} pts
            </div>

            <div className="bg-gray-300 text-purple-900 w-24 h-32 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg">
              🥈
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold mb-2">
              {first.name}
            </div>

            <div className="text-sm mb-2">
              {first.score} pts
            </div>

            <div className="bg-yellow-400 text-purple-900 w-28 h-44 rounded-t-lg flex items-start justify-center pt-2 font-bold text-3xl shadow-xl">
              🥇
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold mb-2">
              {third.name}
            </div>

            <div className="text-sm mb-2">
              {third.score} pts
            </div>

            <div className="bg-orange-400 text-purple-900 w-24 h-24 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg">
              🥉
            </div>
          </div>
        )}

      </div>

      {/* Answer Statistics */}
      <div className="flex gap-5 mt-10">

        {/* Correct */}
        <div className="bg-green-500/20 border border-green-400 rounded-xl px-6 py-4 text-center">
          <div className="text-3xl">✅</div>
          <div className="text-lg font-bold">
            Correct
          </div>
          <div className="text-2xl font-black text-green-300">
            {correctCount}
          </div>
        </div>

        {/* Wrong */}
        <div className="bg-red-500/20 border border-red-400 rounded-xl px-6 py-4 text-center">
          <div className="text-3xl">❌</div>
          <div className="text-lg font-bold">
            Wrong
          </div>
          <div className="text-2xl font-black text-red-300">
            {wrongCount}
          </div>
        </div>

      </div>

    </div>
  );
}
export default Podium;