function Podium({ winners }) {
  // winners = [{ name: "Player1", score: 950 }, { name: "Player2", score: 800 }, { name: "Player3", score: 650 }]
  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-700 to-purple-900 text-white">
      <h1 className="text-4xl font-bold mb-10">🏆 Leaderboard 🏆</h1>

      <div className="flex items-end gap-4">
        
        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold mb-2">{second.name}</div>
            <div className="text-sm mb-2">{second.score} pts</div>
            <div className="bg-gray-300 text-purple-900 w-24 h-32 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg">
              🥈
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold mb-2">{first.name}</div>
            <div className="text-sm mb-2">{first.score} pts</div>
            <div className="bg-yellow-400 text-purple-900 w-28 h-44 rounded-t-lg flex items-start justify-center pt-2 font-bold text-3xl shadow-xl">
              🥇
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold mb-2">{third.name}</div>
            <div className="text-sm mb-2">{third.score} pts</div>
            <div className="bg-orange-400 text-purple-900 w-24 h-24 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg">
              🥉
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Podium;