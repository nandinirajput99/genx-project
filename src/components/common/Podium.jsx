import React, { useEffect } from "react";

function Podium({ winners = [], totalCorrect, totalWrong }) {
  const first = winners[0];
  const second = winners[1];
  const third = winners[2];

  // Joyful Fanfare and Clapping sound with Web Audio API
  useEffect(() => {
    const playPodiumCelebration = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const now = ctx.currentTime;

        // 1. Joyful Fanfare Melody (Brass-style arpeggio & chords)
        const notes = [
          { freq: 261.63, start: 0.0, dur: 0.25, type: "triangle" }, // C4
          { freq: 329.63, start: 0.18, dur: 0.25, type: "triangle" }, // E4
          { freq: 392.00, start: 0.36, dur: 0.25, type: "triangle" }, // G4
          { freq: 523.25, start: 0.54, dur: 0.6, type: "sine" },     // C5
          { freq: 392.00, start: 1.0, dur: 0.2, type: "triangle" },   // G4
          { freq: 523.25, start: 1.2, dur: 0.8, type: "sine" },       // C5 triumphant
          { freq: 659.25, start: 1.2, dur: 0.8, type: "sine" },       // E5 harmony
        ];

        notes.forEach(({ freq, start, dur, type }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.2, now + start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur);
        });

        // 2. Realistic Clapping / Applause sound (gentle noise bursts)
        for (let i = 0; i < 40; i++) {
          const clapTime = now + 0.2 + Math.random() * 2.8;
          const bufferSize = Math.floor(ctx.sampleRate * 0.04);
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let j = 0; j < bufferSize; j++) {
            data[j] = Math.random() * 2 - 1;
          }
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = "bandpass";
          filter.frequency.value = 900 + Math.random() * 900;
          filter.Q.value = 2.0;

          const clapGain = ctx.createGain();
          clapGain.gain.setValueAtTime(0.1, clapTime);
          clapGain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.04);

          noiseSource.connect(filter);
          filter.connect(clapGain);
          clapGain.connect(ctx.destination);

          noiseSource.start(clapTime);
        }
      } catch (err) {
        console.log("Audio celebration error:", err);
      }
    };

    playPodiumCelebration();
  }, []);

  // Overall correct and wrong answers calculation
  const correctCount =
    totalCorrect !== undefined
      ? totalCorrect
      : winners.reduce(
          (acc, player) =>
            acc + (player.correctCount ?? (player.correct ? 1 : 0)),
          0
        );

  const wrongCount =
    totalWrong !== undefined
      ? totalWrong
      : winners.reduce(
          (acc, player) =>
            acc +
            (player.wrongCount ??
              (player.answered === true && player.correct === false ? 1 : 0)),
          0
        );

  return (
    <div className="min-h-screen bg-linear-to-b from-purple-700 to-purple-900 text-white flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">

      {/* Floating Emojis Background / Confetti Emojis */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-2xl sm:text-4xl font-extrabold text-yellow-300 mb-3 animate-bounce">
        <span>🎉</span>
        <span>🥳</span>
        <span className="tracking-wide drop-shadow-md">Congratulations!</span>
        <span>👏</span>
        <span>🎊</span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-10 flex items-center gap-3">
        <span>🏆</span>
        <span>Leaderboard</span>
        <span>🏆</span>
      </h1>

      {/* Podium Positions (2nd, 1st, 3rd) */}
      <div className="flex items-end gap-4 sm:gap-6">

        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center">
            <span className="bg-gray-200 text-purple-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full mb-1 shadow-md">
              2nd Place 🥈
            </span>
            <div className="text-base sm:text-lg font-semibold mb-1">
              {second.name || second.nickname}
            </div>

            <div className="text-xs sm:text-sm font-bold text-yellow-300 mb-2">
              {second.score} pts
            </div>

            <div className="bg-gray-300 text-purple-900 w-24 sm:w-28 h-32 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg border-t-2 border-white/50">
              🥈
            </div>
          </div>
        )}

        {/* 1st Place */}
        {first && (
          <div className="flex flex-col items-center">
            <span className="bg-yellow-400 text-purple-950 font-black text-xs px-3 py-1 rounded-full mb-1 shadow-lg animate-pulse">
              👑 1st Place 🥇
            </span>
            <div className="text-lg sm:text-xl font-bold mb-1">
              {first.name || first.nickname}
            </div>

            <div className="text-sm font-bold text-yellow-300 mb-2">
              {first.score} pts
            </div>

            <div className="bg-yellow-400 text-purple-900 w-28 sm:w-32 h-44 rounded-t-lg flex items-start justify-center pt-2 font-bold text-3xl shadow-xl border-t-2 border-yellow-200">
              🥇
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center">
            <span className="bg-orange-400 text-purple-950 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full mb-1 shadow-md">
              3rd Place 🥉
            </span>
            <div className="text-base sm:text-lg font-semibold mb-1">
              {third.name || third.nickname}
            </div>

            <div className="text-xs sm:text-sm font-bold text-yellow-300 mb-2">
              {third.score} pts
            </div>

            <div className="bg-orange-400 text-purple-900 w-24 sm:w-28 h-24 rounded-t-lg flex items-start justify-center pt-2 font-bold text-2xl shadow-lg border-t-2 border-white/40">
              🥉
            </div>
          </div>
        )}

      </div>

      {/* Answer Statistics: Vibrant Green for Correct, Vibrant Red for Wrong */}
      <div className="flex gap-5 mt-10">

        {/* Correct Answers Box (Green) */}
        <div className="bg-emerald-500/25 border-2 border-emerald-400 rounded-xl px-6 py-4 text-center shadow-[0_0_20px_rgba(52,211,153,0.35)] min-w-[120px]">
          <div className="text-3xl mb-1">✅</div>
          <div className="text-base sm:text-lg font-bold text-emerald-200">
            Correct
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {correctCount}
          </div>
        </div>

        {/* Wrong Answers Box (Red) */}
        <div className="bg-rose-500/25 border-2 border-rose-400 rounded-xl px-6 py-4 text-center shadow-[0_0_20px_rgba(244,63,94,0.35)] min-w-[120px]">
          <div className="text-3xl mb-1">❌</div>
          <div className="text-base sm:text-lg font-bold text-rose-200">
            Wrong
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300">
            {wrongCount}
          </div>
        </div>

      </div>

    </div>
  );
}

export default Podium;