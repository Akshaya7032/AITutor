// "use client";

// import { useState, useEffect, useRef } from "react";
// import Image from "next/image";

// const PhotoFluencyTrainer = () => {
//   const [gameState, setGameState] = useState({
//     totalScore: 0,
//     photoCount: 0,
//     avgScore: 0,
//     recognition: null as SpeechRecognition | null,
//     synth: typeof window !== "undefined" ? window.speechSynthesis : null,
//     voice: null as SpeechSynthesisVoice | null,
//     currentPhoto: null as { url: string; category: string; hints: string[] } | null,
//     photoTimer: null as NodeJS.Timeout | null,
//     isTiming: false,
//     fullTranscript: "",
//   });

//   const [currentLang, setCurrentLang] = useState("en");
//   const [status, setStatus] = useState("Click 'START' to begin! 📸");
//   const startBtnRef = useRef<HTMLButtonElement>(null);
//   const transcriptRef = useRef<HTMLDivElement>(null);
//   const [photoDisplay, setPhotoDisplay] = useState<JSX.Element | null>(null);

//   const languages = {
//     en: { name: "English", langCode: "en-US" },
//     es: { name: "Spanish", langCode: "es-ES" },
//     fr: { name: "French", langCode: "fr-FR" },
//     de: { name: "German", langCode: "de-DE" },
//   };

//   const photoLibrary = {
//     people: [
//       "https://picsum.photos/400/300?random=1",
//       "https://picsum.photos/400/300?random=11",
//       "https://picsum.photos/400/300?random=21",
//       "https://picsum.photos/400/300?random=31",
//       "https://picsum.photos/400/300?random=41",
//     ],
//     food: [
//       "https://picsum.photos/400/300?random=4",
//       "https://picsum.photos/400/300?random=14",
//       "https://picsum.photos/400/300?random=24",
//       "https://picsum.photos/400/300?random=34",
//       "https://picsum.photos/400/300?random=44",
//     ],
//     travel: [
//       "https://picsum.photos/400/300?random=7",
//       "https://picsum.photos/400/300?random=17",
//       "https://picsum.photos/400/300?random=27",
//       "https://picsum.photos/400/300?random=37",
//       "https://picsum.photos/400/300?random=47",
//     ],
//     nature: [
//       "https://picsum.photos/400/300?random=51",
//       "https://picsum.photos/400/300?random=61",
//       "https://picsum.photos/400/300?random=71",
//       "https://picsum.photos/400/300?random=81",
//       "https://picsum.photos/400/300?random=91",
//     ],
//   };

//   useEffect(() => {
//     if (typeof window === "undefined") return;

//     const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRec) {
//       setStatus("Speech recognition not supported. Please use Chrome or Edge.");
//       return;
//     }

//     const recognition = new SpeechRec();
//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognition.lang = languages[currentLang].langCode;
//     console.log("Recognition initialized with lang:", recognition.lang);

//     recognition.onresult = (event) => {
//       let interim = "";
//       let final = "";
//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         if (event.results[i].isFinal) {
//           final += event.results[i][0].transcript + " ";
//         } else {
//           interim += event.results[i][0].transcript;
//         }
//       }
//       const newTranscript = (gameState.fullTranscript + final).trim();
//       setGameState((prev) => ({ ...prev, fullTranscript: newTranscript }));
//       console.log("Transcript updated:", newTranscript || interim);
//       if (transcriptRef.current) {
//         transcriptRef.current.textContent = newTranscript || interim || "🔴 SPEAK LOUDER!";
//       }
//     };

//     recognition.onstart = () => console.log("Recognition started");
//     recognition.onend = () => console.log("Recognition ended");
//     recognition.onerror = (event) => console.log("Recognition error:", event.error);

//     setGameState((prev) => ({ ...prev, recognition }));
//     selectVoice();

//     return () => {
//       if (recognition) recognition.stop();
//       if (gameState.photoTimer) clearInterval(gameState.photoTimer);
//     };
//   }, [currentLang]);

//   const selectVoice = () => {
//     if (!gameState.synth) return;
//     const voices = gameState.synth.getVoices();
//     if (voices.length === 0) {
//       gameState.synth.onvoiceschanged = selectVoice;
//       return;
//     }
//     const voiceMap = { en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE" };
//     const voice =
//       voices.find((v) => v.lang === voiceMap[currentLang.split("-")[0]]) ||
//       voices.find((v) => v.lang === "en-US");
//     setGameState((prev) => ({ ...prev, voice }));
//   };

//   const loadRandomPhoto = () => {
//     if (gameState.photoTimer) clearInterval(gameState.photoTimer);
//     setGameState((prev) => ({ ...prev, isTiming: false, fullTranscript: "" }));

//     const categories = Object.keys(photoLibrary);
//     const category = categories[Math.floor(Math.random() * categories.length)];
//     const randomIndex = Math.floor(Math.random() * photoLibrary[category].length);
//     const photoUrl = photoLibrary[category][randomIndex];

//     const currentPhoto = { url: photoUrl, category, hints: getPhotoHints(category) };
//     setGameState((prev) => ({ ...prev, currentPhoto, photoCount: prev.photoCount + 1 }));
//     setPhotoDisplay(
//       <>
//         <Image
//           src={photoUrl}
//           alt="Photo to describe"
//           width={400}
//           height={300}
//           className="max-w-full max-h-[250px] rounded-md border-2 border-yellow-500"
//         />
//         <div className="photo-title text-2xl text-yellow-500 mt-2">NEW {category.toUpperCase()} PHOTO!</div>
//         <div className="hints text-sm text-gray-200 mt-2">{currentPhoto.hints.join(" | ")}</div>
//         <div className="timer text-2xl text-yellow-500 mt-2">Click to START!</div>
//       </>
//     );

//     setStatus(`${category.toUpperCase()} PHOTO! Click START → Talk 30s!`);
//     if (startBtnRef.current) {
//       startBtnRef.current.disabled = false;
//       startBtnRef.current.textContent = "START";
//       startBtnRef.current.className = "start-btn w-32 h-32 rounded-full border-none cursor-pointer text-4xl bg-green-600 text-white transition-all duration-300 hover:bg-green-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed mr-2";
//     }
//     if (transcriptRef.current) transcriptRef.current.textContent = "Start talking...";
//   };

//   const getPhotoHints = (category: string) => {
//     const hints = {
//       people: ["What clothes?", "Emotion?", "Location?"],
//       food: ["What food?", "Color?", "Hot or cold?"],
//       travel: ["Where?", "Time of day?", "Weather?"],
//       nature: ["What plants?", "Colors?", "Season?"],
//     };
//     return hints[category] || ["What do you see?", "Colors?", "Feelings?"];
//   };

//   const startTimer = () => {
//     setGameState((prev) => ({ ...prev, isTiming: true, fullTranscript: "" }));
//     if (startBtnRef.current) {
//       startBtnRef.current.disabled = true;
//       startBtnRef.current.className = "start-btn w-32 h-32 rounded-full border-none cursor-pointer text-4xl bg-green-600 text-white transition-all duration-300 hover:bg-green-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed mr-2";
//     }
//     if (transcriptRef.current) transcriptRef.current.textContent = "🔴 LISTENING... SPEAK NOW!";

//     if (gameState.recognition) gameState.recognition.start();

//     let timeLeft = 30;
//     setPhotoDisplay((prev) => {
//       const timerDisplay = prev?.props.children[3] as HTMLDivElement | undefined;
//       if (timerDisplay) timerDisplay.textContent = `⏱ ${timeLeft}s - TALK NOW!`;
//       return prev;
//     });
//     setStatus("🗣 KEEP TALKING - 30 SECONDS!");

//     gameState.photoTimer = setInterval(() => {
//       timeLeft--;
//       setPhotoDisplay((prev) => {
//         const timerDisplay = prev?.props.children[3] as HTMLDivElement | undefined;
//         if (timerDisplay) timerDisplay.textContent = `⏱ ${timeLeft}s`;
//         return prev;
//       });
//       if (timeLeft <= 10) {
//         setStatus(`⏰ ${timeLeft}s LEFT - KEEP TALKING!`);
//       }
//       if (timeLeft === 0) {
//         clearInterval(gameState.photoTimer!);
//         if (gameState.recognition) {
//           const finalTranscript = gameState.fullTranscript.trim();
//           gameState.recognition.stop();
//           showAutoResults(finalTranscript);
//         }
//       }
//     }, 1000);
//   };

//   const showAutoResults = async (transcript: string) => {
//     console.log("Final transcript for scoring:", transcript);
//     if (!transcript) {
//       setStatus("❌ NO SPEECH! Speak LOUDER!");
//       if (startBtnRef.current) {
//         startBtnRef.current.disabled = false;
//         startBtnRef.current.textContent = "🔄 RETRY";
//       }
//       return;
//     }

//     // Fallback word count logic if API fails
//     const words = transcript.split(" ").length;
//     let score, feedback;
//     if (words >= 20) { score = 95; feedback = "🎉 NATIVE FLUENCY!"; }
//     else if (words >= 12) { score = 85; feedback = "✅ EXCELLENT!"; }
//     else if (words >= 6) { score = 70; feedback = "👍 GOOD!"; }
//     else { score = 40; feedback = "📈 TRY MORE!"; }

//     // Try OpenRouter API for AI scoring
//     const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
//     if (apiKey && gameState.currentPhoto) {
//       try {
//         setStatus("🤖 AI Analyzing your speech...");
//         const prompt = `You are a language tutor. The user spoke this transcript about a ${gameState.currentPhoto.category} photo (hints: ${gameState.currentPhoto.hints.join(', ')}): "${transcript}".

// Score the fluency (0-100) based on:
// - Relevance to photo/hints (30%)
// - Grammar and vocabulary (30%)
// - Fluency and pronunciation (40%)

// Respond ONLY with JSON: {"score": <number>, "feedback": "<string>"}`; // Removed example JSON

//         console.log("API Prompt:", prompt);
//         const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${apiKey}`,
//           },
//           body: JSON.stringify({
//             model: "openai/gpt-3.5-turbo",
//             messages: [{ role: "user", content: prompt }],
//             max_tokens: 100,
//           }),
//         });

//         if (response.ok) {
//           const data = await response.json();
//           console.log("API Response:", data);
//           const aiResponse = data.choices[0].message.content;
//           console.log("Raw AI Response:", aiResponse);
//           try {
//             const parsed = JSON.parse(aiResponse);
//             score = parsed.score;
//             feedback = parsed.feedback;
//             console.log("Parsed Score:", score, "Parsed Feedback:", feedback);
//           } catch (parseError) {
//             console.error("JSON Parse Error:", parseError, "Falling back to word count");
//           }
//         } else {
//           console.warn("API Request Failed:", response.status, await response.text());
//         }
//       } catch (err) {
//         console.warn("OpenRouter API error, using fallback score:", err);
//       }
//     }

//     showFinalResult(score, feedback);
//   };

//   const showFinalResult = (score: number, feedback: string) => {
//     setGameState((prev) => ({
//       ...prev,
//       totalScore: prev.totalScore + score,
//       avgScore: Math.round((prev.totalScore + score) / prev.photoCount),
//     }));

//     if (startBtnRef.current) {
//       startBtnRef.current.disabled = false;
//       startBtnRef.current.textContent = "🆕 NEXT PHOTO";
//       startBtnRef.current.className = "start-btn w-32 h-32 rounded-full border-none cursor-pointer text-4xl bg-red-600 text-white transition-all duration-300 hover:bg-red-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed mr-2 next-photo";
//     }
//     setStatus(`✅ <strong>${score}% ${feedback}</strong><br>Click NEXT for NEW PHOTO!`);
//   };

//   const showHint = () => {
//     const hints = gameState.currentPhoto?.hints || ["Colors, objects, feelings!"];
//     alert(`💡 HINTS:\n• ${hints.join("\n• ")}\n\nEXAMPLE: "Beautiful blue water and green trees!"`);
//   };

//   const handleStartBtn = () => {
//     const btn = startBtnRef.current;
//     if (btn?.textContent?.includes("NEXT")) {
//       loadRandomPhoto();
//     } else {
//       startTimer();
//     }
//   };

//   useEffect(() => {
//     loadRandomPhoto();
//   }, []);

//   return (
//     <div className="rounded-lg border border-gray-200/50 bg-white/95 p-4 shadow-lg">
//       <div className="header text-center text-gray-800 mb-6">
//         <h1 className="text-2xl font-bold">Photo Fluency Trainer</h1>
//         <p className="text-md font-semibold">Talk for next 30secs!</p>
//       </div>

//       <div className="language-selector absolute top-4 right-4 bg-white/90 p-2 rounded-lg">
//         <select
//           value={currentLang}
//           onChange={(e) => setCurrentLang(e.target.value)}
//           className="p-1 rounded bg-transparent"
//         >
//           <option value="en">🇺🇸 English</option>
//           <option value="es">🇪🇸 Spanish</option>
//           <option value="fr">🇫🇷 French</option>
//           <option value="de">🇩🇪 German</option>
//         </select>
//       </div>

//       <div className="photo-box bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 rounded-lg text-center min-h-[400px]">
//         {photoDisplay}
//       </div>

//       <div className="controls-box bg-gray-100 p-4 rounded-lg text-center mt-4 border border-gray-300">
//         <br />
//         <button
//           ref={startBtnRef}
//           className="start-btn w-32 h-32 rounded-full border-none cursor-pointer text-4xl bg-green-600 text-white transition-all duration-300 hover:bg-green-700 hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed mr-2"
//           onClick={handleStartBtn}
//         >
//           START
//         </button>
//         <div
//           ref={transcriptRef}
//           id="transcript"
//           className="mt-4 p-3 bg-white rounded-md border border-gray-300 font-mono min-h-[30px] text-center text-lg"
//         >
//           Start talking... your words appear here!
//         </div>
//       </div>

//       <div className="text-center mt-4">
//         <button
//           onClick={loadRandomPhoto}
//           className="hint-btn bg-white/20 border-none text-black px-4 py-2 rounded-full cursor-pointer mr-2 hover:bg-white/30"
//         >
//           🆕 New Photo
//         </button>
//         <button
//           onClick={showHint}
//           className="hint-btn bg-white/20 border-none text-black px-4 py-2 rounded-full cursor-pointer hover:bg-white/30"
//         >
//           💡 Hints
//         </button>
//       </div>

//       <div
//         id="status"
//         className="status p-4 rounded-lg mt-4 text-center font-bold text-lg"
//         dangerouslySetInnerHTML={{ __html: status }}
//       />

//       <div className="stats bg-gray-200 p-4 rounded-lg mt-4 grid grid-cols-3 gap-4 text-center">
//         <div className="stat-item bg-white p-3 rounded-lg">
//           <div className="stat-number">{gameState.avgScore}%</div>
//           <div>Avg Score</div>
//         </div>
//         <div className="stat-item bg-white p-3 rounded-lg">
//           <div className="stat-number">{gameState.totalScore}</div>
//           <div>Total Score</div>
//         </div>
//         <div className="stat-item bg-white p-3 rounded-lg">
//           <div className="stat-number">{gameState.photoCount}</div>
//           <div>Photos</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PhotoFluencyTrainer;

"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Photo {
  url: string;
  category: string;
  hints: string[];
}

export default function PhotoFluencyTrainer() {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [status, setStatus] = useState("Click 'START' to begin! 📸");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTiming, setIsTiming] = useState(false);
  const [fullTranscript, setFullTranscript] = useState("");
  const [currentLang, setCurrentLang] = useState("en");

  const startBtnRef = useRef<HTMLButtonElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const languages = {
    en: { name: "English", langCode: "en-US" },
    es: { name: "Spanish", langCode: "es-ES" },
    fr: { name: "French", langCode: "fr-FR" },
    de: { name: "German", langCode: "de-DE" },
  };

  const photoLibrary = {
    people: [1, 11, 21, 31, 41],
    food: [4, 14, 24, 34, 44],
    travel: [7, 17, 27, 37, 47],
    nature: [51, 61, 71, 81, 91],
  };

  // 🧠 Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setStatus("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }

    const recog: SpeechRecognition = new SpeechRec();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = languages[currentLang].langCode;

    recog.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      setFullTranscript((prev) => (prev + transcript).trim());
      if (transcriptRef.current) transcriptRef.current.textContent = transcript || "🔴 SPEAK LOUDER!";
    };

    setRecognition(recog);

    return () => {
      recog.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentLang]);

  // 📸 Load random photo
  const loadRandomPhoto = () => {
    setIsTiming(false);
    setFullTranscript("");
    setTimeLeft(30);

    const categories = Object.keys(photoLibrary) as (keyof typeof photoLibrary)[];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const randomId = photoLibrary[category][Math.floor(Math.random() * photoLibrary[category].length)];
    const url = `https://picsum.photos/400/300?random=${randomId}`;

    const newPhoto: Photo = { url, category, hints: getHints(category) };
    setCurrentPhoto(newPhoto);
    setPhotoCount((c) => c + 1);
    setStatus(`${category.toUpperCase()} PHOTO! Click START → Talk 30s!`);

    if (startBtnRef.current) {
      startBtnRef.current.disabled = false;
      startBtnRef.current.textContent = "START";
    }
    if (transcriptRef.current) transcriptRef.current.textContent = "Start talking...";
  };

  const getHints = (category: string) => {
    const hints: Record<string, string[]> = {
      people: ["What clothes?", "Emotion?", "Location?"],
      food: ["What food?", "Color?", "Hot or cold?"],
      travel: ["Where?", "Time of day?", "Weather?"],
      nature: ["What plants?", "Colors?", "Season?"],
    };
    return hints[category] || ["What do you see?", "Colors?", "Feelings?"];
  };

  const startTimer = () => {
    if (!recognition) return;
    setIsTiming(true);
    setFullTranscript("");
    setTimeLeft(30);
    recognition.start();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          recognition.stop();
          scoreTranscript(fullTranscript);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const scoreTranscript = (text: string) => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    let score = 0;
    let feedback = "";

    if (wordCount >= 20) { score = 95; feedback = "🎉 NATIVE FLUENCY!"; }
    else if (wordCount >= 12) { score = 85; feedback = "✅ EXCELLENT!"; }
    else if (wordCount >= 6) { score = 70; feedback = "👍 GOOD!"; }
    else { score = 40; feedback = "📈 TRY MORE!"; }

    setTotalScore((prev) => prev + score);
    setAvgScore((prevTotal) => Math.round((totalScore + score) / photoCount));
    setStatus(`✅ <strong>${score}% ${feedback}</strong><br>Click NEXT for NEW PHOTO!`);

    if (startBtnRef.current) {
      startBtnRef.current.disabled = false;
      startBtnRef.current.textContent = "🆕 NEXT PHOTO";
    }
  };

  const handleStartBtn = () => {
    const text = startBtnRef.current?.textContent;
    if (text?.includes("NEXT")) {
      loadRandomPhoto();
    } else {
      startTimer();
    }
  };

  useEffect(() => {
    loadRandomPhoto();
  }, []);

  return (
    <div className="rounded-lg border p-4 shadow-lg bg-white/95">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Photo Fluency Trainer</h1>
        <p className="text-gray-900">Talk for 30 seconds about what you see!</p>
      </div>

      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg">
        <select value={currentLang} onChange={(e) => setCurrentLang(e.target.value)}>
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Spanish</option>
          <option value="fr">🇫🇷 French</option>
          <option value="de">🇩🇪 German</option>
        </select>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4 rounded-lg text-center min-h-[400px]">
        {currentPhoto && (
          <>
            <Image src={currentPhoto.url} alt="photo" width={400} height={300} className="mx-auto rounded-md" />
            <div className="mt-2 text-xl">{currentPhoto.category.toUpperCase()}</div>
            <div className="mt-1 text-sm">{currentPhoto.hints.join(" | ")}</div>
            {isTiming && <div className="mt-2 text-2xl">⏱ {timeLeft}s</div>}
          </>
        )}
      </div>

      <div className="text-center mt-4">
        <button
          ref={startBtnRef}
          onClick={handleStartBtn}
          className="w-32 h-32 rounded-full text-4xl bg-green-600 text-dark hover:bg-green-700"
        >
          START
        </button>

        <div ref={transcriptRef} className="mt-4 p-3 bg-white border rounded font-mono min-h-[30px] text-lg text-gray-900">
          Start talking... your words appear here!
        </div>
      </div>

      <div className="mt-4 p-4 text-center font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: status }} />

      <div className="grid grid-cols-3 gap-4 bg-gray-200 p-4 rounded-lg mt-4 text-center">
        <div className="bg-white p-3 rounded-lg">
          <div className="text-xl text-gray-900">{avgScore}%</div>
          <div className="text-gray-900">Avg Score</div>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <div className="text-xl text-gray-900">{totalScore}</div>
          <div className="text-gray-900">Total Score</div>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <div className="text-xl text-gray-900">{photoCount}</div>
          <div className="text-gray-900">Photos</div>
        </div>
      </div>
    </div>
  );
}
