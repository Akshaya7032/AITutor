// components/games/listening-challenge-game.tsx
import React, { useState } from "react";

const API_KEY = "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"; // Replace with your OpenAI API key

const ListeningChallengeGame: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>("");
  const [language, setLanguage] = useState<string>("English");
  const [difficulty, setDifficulty] = useState<string>("Easy");
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [currentSentence, setCurrentSentence] = useState<string>("");
  const [wordBank, setWordBank] = useState<string[]>([]);
  const [sentenceContainer, setSentenceContainer] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [usedSentences, setUsedSentences] = useState<Record<string, string[]>>({});

  const getAISentence = async (language: string, difficulty: string) => {
    const key = `${language}_${difficulty}`;
    const used = usedSentences[key] || JSON.parse(localStorage.getItem(key) || "[]");

    let uniqueSentence = "";
    let retries = 0;

    let difficultyInstruction = "";
    if (difficulty === "Easy") {
      difficultyInstruction = `Generate a very simple sentence in ${language}. Use only short, basic words (max 6 words) and simple grammar.`;
    } else if (difficulty === "Medium") {
      difficultyInstruction = `Generate a moderately complex sentence in ${language}. Use intermediate vocabulary and sentence structures.`;
    } else if (difficulty === "Hard") {
      difficultyInstruction = `Generate a difficult sentence in ${language}. Use advanced vocabulary, longer sentences, and complex grammar.`;
    }

    do {
      const prompt = `${difficultyInstruction} Ensure the sentence is meaningful, grammatically correct, and not similar to these: ${used.join(", ")}`;
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: difficulty === "Easy" ? 20 : 50,
        }),
      });

      const data = await response.json();
      uniqueSentence = data.choices?.[0]?.message?.content?.trim() || "";
      retries++;
    } while (used.includes(uniqueSentence) && retries < 3);

    if (uniqueSentence) {
      const updatedUsed = { ...usedSentences, [key]: [...used, uniqueSentence] };
      setUsedSentences(updatedUsed);
      localStorage.setItem(key, JSON.stringify(updatedUsed[key]));
    }

    return uniqueSentence;
  };

  const startGame = async () => {
    if (!playerName.trim()) return alert("Please enter your name!");
    setGameStarted(true);
    setScore(0);
    await loadNewSentence();
  };

  const loadNewSentence = async () => {
    const sentence = await getAISentence(language, difficulty);
    if (!sentence) return alert("⚠ Couldn't fetch a new sentence. Try again.");

    setCurrentSentence(sentence);
    const words = sentence.replace(/[.,!?]/g, "").split(" ");
    setWordBank(words.sort(() => Math.random() - 0.5));
    setSentenceContainer([]);
  };

  const handleWordClick = (word: string, fromBank: boolean) => {
    if (fromBank) {
      setSentenceContainer([...sentenceContainer, word]);
      setWordBank(wordBank.filter((w, i) => i !== wordBank.indexOf(word)));
    } else {
      setWordBank([...wordBank, word]);
      setSentenceContainer(sentenceContainer.filter((w, i) => i !== sentenceContainer.indexOf(word)));
    }
  };

  const submitSentence = async () => {
    const userSentence = sentenceContainer.join(" ").trim();
    if (userSentence.toLowerCase() === currentSentence.toLowerCase().replace(/[.,!?]/g, "")) {
      const newScore = score + 10;
      setScore(newScore);
      if (newScore >= 30) {
        alert("🎉 Congratulations! You reached 30 points!");
        backToMenu();
        return;
      }
      await loadNewSentence();
    } else {
      alert("❌ Incorrect! Try again.");
    }
  };

  const backToMenu = () => {
    setGameStarted(false);
    setPlayerName("");
    setCurrentSentence("");
    setWordBank([]);
    setSentenceContainer([]);
    setScore(0);
  };

  return (
    <div style={{
      fontFamily: "Poppins, sans-serif",
      textAlign: "center",
      background: "linear-gradient(135deg, #89f7fe, #66a6ff)",
      minHeight: "100vh",
      color: "#333",
      padding: "0",
    }}>
      <h1 style={{ marginTop: "40px", color: "#0b3d91" }}>AI Phrase Builder Game</h1>

      {!gameStarted && (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{ padding: "10px", margin: "8px", fontSize: "16px", borderRadius: "8px" }}
          />
          <br />
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: "10px", margin: "8px", fontSize: "16px", borderRadius: "8px" }}>
            <option value="English">English</option>
            <option value="French">French</option>
            <option value="Hindi">Hindi</option>
          </select>
          <br />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: "10px", margin: "8px", fontSize: "16px", borderRadius: "8px" }}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <br />
          <button onClick={startGame} style={{ backgroundColor: "#0b3d91", color: "white", cursor: "pointer", padding: "10px 20px", borderRadius: "8px" }}>Start Game</button>
        </div>
      )}

      {gameStarted && (
        <div>
          <h3>Player: {playerName}</h3>
          <h3>Score: {score}</h3>

          <div style={{ margin: "20px auto", minHeight: "60px", padding: "15px", width: "80%", border: "2px dashed #333", borderRadius: "12px", background: "rgba(255,255,255,0.8)" }}>
            {sentenceContainer.map((word, i) => (
              <span key={i} style={{ display: "inline-block", padding: "8px 14px", margin: "6px", borderRadius: "10px", backgroundColor: "#0b3d91", color: "white", cursor: "pointer" }}
                onClick={() => handleWordClick(word, false)}>
                {word}
              </span>
            ))}
          </div>

          <div style={{ margin: "20px auto", minHeight: "60px", padding: "15px", width: "80%", border: "2px dashed #333", borderRadius: "12px", background: "rgba(255,255,255,0.8)" }}>
            {wordBank.map((word, i) => (
              <span key={i} style={{ display: "inline-block", padding: "8px 14px", margin: "6px", borderRadius: "10px", backgroundColor: "#0b3d91", color: "white", cursor: "pointer" }}
                onClick={() => handleWordClick(word, true)}>
                {word}
              </span>
            ))}
          </div>

          <button onClick={submitSentence} style={{ backgroundColor: "#0b3d91", color: "white", cursor: "pointer", padding: "10px 20px", borderRadius: "8px", marginRight: "10px" }}>Submit</button>
          <button onClick={backToMenu} style={{ backgroundColor: "#0b3d91", color: "white", cursor: "pointer", padding: "10px 20px", borderRadius: "8px" }}>Back to Menu</button>
        </div>
      )}
    </div>
  );
};

export default ListeningChallengeGame;
