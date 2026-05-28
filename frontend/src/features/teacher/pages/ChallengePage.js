import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../../css/InstructorModule.css'; // Reuse styles
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';
 
export default function ChallengePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
 
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };
  const navigate = useNavigate();
  const [selectedChallengeType, setSelectedChallengeType] = useState('normal'); // Default to normal
  const [selectedChallengeDetails, setSelectedChallengeDetails] = useState(null);
  const [normalChallenges, setNormalChallenges] = useState([]);
  const [fallingChallenges, setFallingChallenges] = useState([]);
  const [fallingSpeed, setFallingSpeed] = useState(1); // 1 = normal, 2 = fast, etc.
  const [useLives, setUseLives] = useState(true);
 
  // Fetch challenges when the component mounts
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // Fetch normal challenges (Paragraph type)
        const normalResponse = await authFetch(`${API_BASE}/api/challenges`);
        const normalData = await normalResponse.json();
 
        // Fetch falling challenges (List of words)
        const fallingResponse = await authFetch(`${API_BASE}/api/challenges/falling`);
        const fallingData = await fallingResponse.json();
 
        // Set challenges into separate states
        setNormalChallenges(normalData);
        setFallingChallenges(fallingData);
        console.log('Normal Challenges:', normalData);
        console.log('Falling Challenges:', fallingData);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      }
    };
    fetchChallenges();
  }, []);
 
  const handleSelectChallenge = (challenge) => {
    if (challenge.words) {
      // Store in sessionStorage for FallingTypingTest to pick up
      sessionStorage.setItem("fallingChallenge", JSON.stringify(challenge));
    }
    setSelectedChallengeDetails(challenge); // Set selected challenge details
    console.log('Selected challenge:', challenge); // Debug: log challenge object to verify ID field
  };
  const handleEditChallenge = (challenge) => {
    setSelectedChallengeDetails(challenge);
    console.log('Editing challenge:', challenge); // Debug: log challenge object
  };
 
  // Delete handler: delete challenge via API, then refresh list
  const handleDeleteChallenge = async (challenge) => {
    try {
      // Use challengeId if available, fallback to id
      const challengeId = challenge.challengeId || challenge.id;
      if (!challengeId) {
        alert('Error: Challenge ID not found');
        return;
      }

      const url = challenge.paragraph
        ? `${API_BASE}/api/challenges/${challengeId}`
        : `${API_BASE}/api/challenges/falling/${challengeId}`;

      const response = await authFetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Challenge deleted!');
        // Refresh challenges
        if (challenge.paragraph) {
          setNormalChallenges((prev) => prev.filter(c => (c.challengeId || c.id) !== challengeId));
        } else {
          setFallingChallenges((prev) => prev.filter(c => (c.challengeId || c.id) !== challengeId));
        }

        // Clear selection if deleted challenge is selected
        if ((selectedChallengeDetails?.challengeId || selectedChallengeDetails?.id) === challengeId) {
          setSelectedChallengeDetails(null);
        }
      } else {
        alert('Failed to delete challenge.');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };  return (
    <>
  {/* Navbar OUTSIDE the container */}
  <nav className="navbar">
    {/* <button className="hamburger-icon" onClick={toggleMenu}>☰</button>
    {isMenuOpen && (
      <div className="side-menu-overlay" onClick={toggleMenu}>
        <div className="side-menu" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={toggleMenu}>×</button>
          <nav className="menu-links">
            <Link to="/typingtest" onClick={toggleMenu}>Typing Test</Link>
            <Link to="/bookworm" onClick={toggleMenu}>Bookworm</Link>
            <Link to="/galaxy" onClick={toggleMenu}>Galaxy</Link>
            <Link to="/instructor" onClick={toggleMenu}>Instructor Module</Link>
            <Link to="/challenges" onClick={toggleMenu}>Challenges</Link>
            <Link to="/lesson" onClick={toggleMenu}>Create Lesson</Link>
          </nav>
        </div>
      </div>
    )} */}
    <div className="navbar-left">
      <h1 className="navbar-title">Typing Test</h1>
    </div>
    <div className="navbar-right">
      <button className="nav-button" onClick={() => navigate("/")}>Back to Dashboard</button>
    </div>
  </nav>
 
  {/* Main Content */}
  <div className="container content-below-navbar">
    {/* Tabs */}
    <section>
      <h2 className="section-title">Choose Challenge Type</h2>
      <div className="tab-buttons">
        <button
          className={`tab-button ${selectedChallengeType === 'normal' ? 'active' : ''}`}
          onClick={() => setSelectedChallengeType('normal')}
        >
          Normal Typing Test
        </button>
        <button
          className={`tab-button ${selectedChallengeType === 'falling' ? 'active' : ''}`}
          onClick={() => setSelectedChallengeType('falling')}
        >
          Falling Typing Test
        </button>
        <button
    className={`tab-button ${selectedChallengeType === 'galaxy' ? 'active' : ''}`}
    onClick={() => setSelectedChallengeType('galaxy')}
  >
    Galaxy Typing Test
  </button>
   <button
    className={`tab-button ${selectedChallengeType === 'quiz' ? 'active' : ''}`}
    onClick={() => setSelectedChallengeType('quiz')}
  >
    Syntax Saver Quiz
  </button>
   <button
              className={`tab-button ${selectedChallengeType === 'falling-advanced' ? 'active' : ''}`}
              onClick={() => setSelectedChallengeType('falling-advanced')}
            >
              Advanced Falling Typing Test
            </button>
      </div>
    </section>
 
    {/* Forms */}
    <section className="tab-content">
      {selectedChallengeType === 'normal' && (
        <NormalTypingChallengeForm
          selectedChallenge={selectedChallengeDetails?.paragraph ? selectedChallengeDetails : null}
          onSaved={() => window.location.reload()}
        />
      )}
      {selectedChallengeType === 'falling' && (
        <FallingTypingChallengeForm
          selectedChallenge={selectedChallengeDetails?.words ? selectedChallengeDetails : null}
          onSaved={() => window.location.reload()}
          fallingSpeed={fallingSpeed}
          setFallingSpeed={setFallingSpeed}
          useLives={useLives}
          setUseLives={setUseLives}
        />
      )}
      {selectedChallengeType === 'falling-advanced' && (
            <AdvancedFallingTypingChallengeForm
              selectedChallenge={selectedChallengeDetails?.words ? selectedChallengeDetails : null}
              onSaved={() => window.location.reload()}
              fallingSpeed={fallingSpeed}
              setFallingSpeed={setFallingSpeed}
              useLives={useLives}
              setUseLives={setUseLives}
            />
          )}
      {selectedChallengeType === 'galaxy' && (
  <GalaxyTypingChallengeForm
    onSaved={() => console.log("Galaxy challenge words saved")}
  />
)}
{selectedChallengeType === 'quiz' && (
  <QuizCreationForm onSaved={() => console.log("Quiz saved")} />
)}
 
    </section>
 
    {/* Saved Challenges */}
    <section>
      <h2 className="section-title">Saved Challenges</h2>
      {selectedChallengeType === 'normal' && normalChallenges.length > 0 ? (
        <ChallengeList
          challenges={normalChallenges}
          type="Normal"
          onSelect={handleSelectChallenge}
          onEdit={handleEditChallenge}
          onDelete={handleDeleteChallenge}
        />
      ) : selectedChallengeType === 'falling' && fallingChallenges.length > 0 ? (
        <ChallengeList
          challenges={fallingChallenges}
          type="Falling"
          onSelect={handleSelectChallenge}
          onEdit={handleEditChallenge}
          onDelete={handleDeleteChallenge}
        />
      ) : (
        <p>No challenges saved yet.</p>
      )}
    </section>
  </div>
</>
 
  );
}
 
// List Component to Display Challenges
function ChallengeList({ challenges, type, onSelect, onEdit, onDelete }) {
  return (
    <table className="challenges-table">
      <thead>
        <tr>
          <th>{type} Challenge Type</th>
          <th>Preview</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {challenges.map((challenge) => {
          const challengeId = challenge.challengeId || challenge.id;
          return (
            <tr
              key={challengeId}
              className="challenge-item"
              onClick={() => onSelect(challenge)}
            >
              <td>{type} Challenge</td>
              <td>
                {challenge.paragraph
                  ? challenge.paragraph.slice(0, 50) + '...'
                  : (challenge.words && challenge.words.length > 0
                      ? challenge.words.join(', ').slice(0, 50) + '...'
                      : 'No words available')}
              </td>
              <td>
                <button
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(challenge);
                  }}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this challenge?')) {
                      onDelete(challenge);
                    }
                  }}
                  style={{
                    marginLeft: '35px',
                    color: 'white',
                    backgroundColor: 'red',
                    borderRadius: '5px',
                    height: '30px',
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}// Normal Typing Challenge Form
function NormalTypingChallengeForm({ selectedChallenge, onSaved }) {
  const [paragraph, setParagraph] = useState('');
 
  useEffect(() => {
    if (selectedChallenge && selectedChallenge.paragraph) {
      setParagraph(selectedChallenge.paragraph);
    }
  }, [selectedChallenge]);
 
  const handleSave = async () => {
    try {
      const method = selectedChallenge ? 'PUT' : 'POST';
      const challengeId = selectedChallenge?.challengeId || selectedChallenge?.id;
      const url = selectedChallenge
        ? `${API_BASE}/api/challenges/${challengeId}`
        : `${API_BASE}/api/challenges`;

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedChallenge, paragraph }),
      });
 
      if (response.ok) {
        alert(`Challenge ${selectedChallenge ? 'updated' : 'saved'}!`);
        setParagraph('');
        onSaved(); // Refresh list
      } else {
        alert('Failed to save.');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };
 
  return (
    <div>
      <h3>Create a Normal Typing Challenge</h3>
      <textarea
        className="input"
        style={{ width: "100%", height: "100px", fontFamily: "monospace" }}
        value={paragraph}
        onChange={(e) => setParagraph(e.target.value)}
      />
      <button className="button" onClick={handleSave}>
        {selectedChallenge ? "Update" : "Save"} Challenge
      </button>
    </div>
  );
}
 
// Falling Typing Challenge Form
function FallingTypingChallengeForm({ selectedChallenge, onSaved,fallingSpeed,
  setFallingSpeed,
  useLives,
  setUseLives })
   {
    const [fallingWords, setFallingWords] = useState('');
  const [timerDuration, setTimerDuration] = useState(60); // Default: 60 seconds
  useEffect(() => {
    if (selectedChallenge && selectedChallenge.words) {
      setFallingWords(selectedChallenge.words.join(', '));
      if (selectedChallenge.timer) setTimerDuration(selectedChallenge.timer);
      if (selectedChallenge.speed) setFallingSpeed(selectedChallenge.speed);
      if (selectedChallenge.useLives !== undefined) setUseLives(selectedChallenge.useLives);
    }
  }, [selectedChallenge, setFallingWords, setTimerDuration, setFallingSpeed, setUseLives]);
  const handleSave = async () => {
    if (fallingWords.trim()) {
      try {
        const method = selectedChallenge ? 'PUT' : 'POST';
        const challengeId = selectedChallenge?.challengeId || selectedChallenge?.id;
        const url = selectedChallenge
          ? `${API_BASE}/api/challenges/${challengeId}`
          : `${API_BASE}/api/challenges/falling`;

        const response = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...selectedChallenge,
            words: fallingWords.split(',').map(word => word.trim()),
            timer: timerDuration,
            speed: fallingSpeed,
            useLives: useLives
          }),
        });
 
        if (response.ok) {
          alert(`Falling challenge ${selectedChallenge ? 'updated' : 'saved'}!`);
          setFallingWords('');
          setTimerDuration(60);
          onSaved(); // Refresh list
        } else {
          alert('Failed to save.');
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    }
  };
 
  return (
    <div>
      <h3>Create a Falling Typing Challenge</h3>
      <textarea
        className="input"
        style={{ width: "100%", height: "100px", fontFamily: "monospace" }}
        placeholder="Enter falling words separated by commas"
        value={fallingWords}
        onChange={(e) => setFallingWords(e.target.value)}
      />
      <h5>Input Challenge Duration in seconds</h5>
      <input
        type="number"
        className="input"
        value={timerDuration}
        onChange={(e) => setTimerDuration(Number(e.target.value))}
        placeholder="Timer (seconds)"
        min="10"
        style={{ marginTop: "10px", width: "100%" }}
      />
       <h5>Set Falling Speed (1 = normal, higher = faster)</h5>
      <input
        type="number"
        className="input"
        value={fallingSpeed}
        onChange={(e) => setFallingSpeed(Number(e.target.value))}
        min="1"
        max="5"
        style={{ width: "100%" }}
      />
 
      <label style={{ display: "block", marginTop: "10px" }}>
        <input
          type="checkbox"
          checked={useLives}
          onChange={(e) => setUseLives(e.target.checked)}
        /> Enable 3 Lives
      </label>
 
      <button className="button" onClick={handleSave}>Save Challenge</button>
    </div>
  );
 
}
function GalaxyTypingChallengeForm({ onSaved }) {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState("");
 const [galaxyWords, setGalaxyWords] = useState('');
  const handleAddWord = () => {
    if (galaxyWords.trim()) {
      // Convert comma-separated input into an array of words
      const wordsArray = galaxyWords.split(',').map(word => word.trim());
 
      // Save in session storage (or send to API if needed)
      sessionStorage.setItem("galaxyWords", JSON.stringify(wordsArray));
      alert("Galaxy challenge saved!");
 
      setGalaxyWords('');
      onSaved?.();
    }
  };
 
  const handleDeleteWord = (word) => {
    setWords(prev => prev.filter(w => w !== word));
  };
 
  const handleSave = async () => {
  if (galaxyWords.trim()) {
    const wordsArray = galaxyWords.split(',').map(word => word.trim());
 
    try {
      const response = await authFetch(`${API_BASE}/api/challenges/galaxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: wordsArray }),
      });
 
      if (response.ok) {
        alert("Galaxy challenge saved!");
        setGalaxyWords("");
        onSaved?.();
      } else {
        alert("Failed to save challenge.");
      }
    } catch (error) {
      console.error("Error saving galaxy challenge:", error);
    }
  }
};
 
  return (
    <div>
      <h3>Create a Galaxy Typing Challenge</h3>
 
      <textarea
        className="input"
        style={{ width: "100%", height: "100px", fontFamily: "monospace" }}
        placeholder="Enter galaxy words separated by commas"
        value={galaxyWords}
        onChange={(e) => setGalaxyWords(e.target.value)}
      />
 
      <ul>
        {words.map((word, index) => (
          <li key={index}>
            {word}{" "}
            <button
              onClick={() => handleDeleteWord(word)}
              style={{ marginLeft: "10px", color: "white", background: "red" }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
 
      <button className="button" onClick={handleSave}>Save Galaxy Challenge</button>
    </div>
  );
}
function QuizCreationForm({ onSaved }) {
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentType, setCurrentType] = useState("match");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [parts, setParts] = useState([]);
  const [correctOrder, setCorrectOrder] = useState([]);
  const [currentHint, setCurrentHint] = useState("");
 
const handleAddOption = () => {
  if (currentType === "match" && feedback && !options.some(o => o.label === feedback)) {
    setOptions([...options, { label: feedback, icon: "🔹" }]);
    setFeedback("");
  }
};
 
  const handleAddPart = () => {
  if (currentType === "reorder" && correctAnswer.trim()) {
    // Escape internal double quotes to prevent JSON parse errors
    const escaped = correctAnswer.replace(/"/g, '\\"');
    setParts([...parts, escaped]);
    setCorrectAnswer("");
  }
};
 
  const handleAddQuestion = () => {
  if (!currentQuestion.trim()) return alert("Enter a question!");
 
  let questionData = {};
 
  if (currentType === "match") {
    questionData = {
      options: options.map((opt) => opt.label),
      correctAnswer,
    };
  } else if (currentType === "reorder") {
    questionData = {
      parts: parts,
      correctOrder: parts.map((_, i) => i), // define default order
    };
  } else if (currentType === "typing") {
    questionData = {
      buggyCode: feedback,
      correctCode: correctAnswer,
    };
  }
 
  const newQuestion = {
    type: currentType,
    question: currentQuestion,
    data: JSON.stringify(questionData), // must be JSON string
    hint: currentHint || "", // ✅ include hint to match backend entity
  };
 
  setQuestions([...questions, newQuestion]);
 
  // reset inputs
  setCurrentQuestion("");
  setFeedback("");
  setCorrectAnswer("");
  setParts([]);
  setOptions([]);
  setCurrentHint(""); // ✅ clear hint after adding
};
 
 
  const handleSaveQuiz = async () => {
    if (!quizTitle.trim()) return alert("Enter quiz title!");
    if (questions.length === 0) return alert("Add at least one question!");
 
    const quizData = {
      title: quizTitle,
      items: questions,
    };
 
    try {
      const response = await authFetch(`${API_BASE}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });
 
      if (response.ok) {
        alert("Quiz saved successfully!");
        setQuizTitle("");
        setQuestions([]);
        onSaved();
      } else {
        alert("Failed to save quiz.");
      }
    } catch (err) {
      console.error("Error saving quiz:", err);
    }
  };
 
  return (
    <div>
      <h3>Create Syntax Saver Quiz</h3>
      <input
        type="text"
        className="input"
        placeholder="Quiz title (e.g., If Statements & Functions)"
        value={quizTitle}
        onChange={(e) => setQuizTitle(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem" }}
      />
 
      <label>Question Type:</label>
      <select
        value={currentType}
        onChange={(e) => setCurrentType(e.target.value)}
        className="input"
      >
        <option value="match">Match</option>
        <option value="reorder">Reorder</option>
        <option value="typing">Typing</option>
      </select>
 
      <textarea
        className="input"
        placeholder="Enter the question text..."
        value={currentQuestion}
        onChange={(e) => setCurrentQuestion(e.target.value)}
        style={{ width: "100%", height: "80px", marginTop: "0.5rem" }}
      />
 
     {currentType === "match" && (
  <>
    <h4>Options:</h4>
    <input
      className="input"
      placeholder="Enter option text"
      value={feedback}
      onChange={(e) => setFeedback(e.target.value)}
    />
    <button onClick={handleAddOption} className="button">Add Option</button>
 
    <div style={{ marginTop: "0.5rem" }}>
      {options.map((opt, i) => (
        <span key={i} style={{ marginRight: "8px" }}>
          {opt.label}
        </span>
      ))}
    </div>
      <div>
  <label>Hint:</label>
  <input
    type="text"
    value={currentHint}
    onChange={(e) => setCurrentHint(e.target.value)}
    placeholder="Enter a hint (optional)"
  />
</div>
    <h4 style={{ marginTop: "1rem" }}>Select Correct Answer:</h4>
    <select
      className="input"
      value={correctAnswer}
      onChange={(e) => setCorrectAnswer(e.target.value)}
    >
      <option value="">-- Choose correct answer --</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.label}>
          {opt.label}
        </option>
      ))}
    </select>
  </>
)}
 
      {currentType === "reorder" && (
        <>
          <h4>Code Parts:</h4>
          <input
            className="input"
            placeholder="Enter code part"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
          <button onClick={handleAddPart} className="button">Add Part</button>
          <div style={{ marginTop: "0.5rem" }}>
            {parts.map((p, i) => (
              <code key={i} style={{ marginRight: "8px" }}>
                {p}
              </code>
            ))}
          </div>
        </>
      )}
 
      {currentType === "typing" && (
        <>
          <h4>Typing Challenge Setup:</h4>
          <textarea
            className="input"
            placeholder="Buggy code sample (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <textarea
            className="input"
            placeholder="Correct code answer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
        </>
      )}
 
      <button className="button" style={{ marginTop: "1rem" }} onClick={handleAddQuestion}>
        ➕ Add Question
      </button>
 
      <div style={{ marginTop: "1rem" }}>
        <h4>Preview Quiz Questions ({questions.length}):</h4>
        <ul>
          {questions.map((q, i) => (
            <li key={i}>
              <strong>{q.type.toUpperCase()}:</strong> {q.question}
            </li>
          ))}
        </ul>
      </div>
 
      <button
        className="button"
        style={{ marginTop: "1rem", backgroundColor: "green", color: "white" }}
        onClick={handleSaveQuiz}
      >
        💾 Save Quiz
      </button>
    </div>
  );
}
 
function AdvancedFallingTypingChallengeForm({
  selectedChallenge,
  onSaved,
  fallingSpeed,
  setFallingSpeed,
  useLives,
  setUseLives,
}) {
  const [fallingWords, setFallingWords] = useState('');
  const [wrongWords, setWrongWords] = useState('');
  const [timerDuration, setTimerDuration] = useState(60);
  const [totalLives, setTotalLives] = useState(5); // Default 5
 
  useEffect(() => {
    if (selectedChallenge?.words) {
        setFallingWords(selectedChallenge.words.join(', '));
        if (selectedChallenge.wrongWords)
            setWrongWords(selectedChallenge.wrongWords.join(', '));
        if (selectedChallenge.testTimer)
            setTimerDuration(selectedChallenge.testTimer);
        if (selectedChallenge.speed)
            setFallingSpeed(selectedChallenge.speed);
        if (selectedChallenge.useLives !== undefined)
            setUseLives(selectedChallenge.useLives);
        // 👇 CHANGE HERE
        if (selectedChallenge.maxLives) // Read from maxLives
            setTotalLives(selectedChallenge.maxLives); // Set the totalLives state
    }
  }, [selectedChallenge]);
 
  const handleSave = async () => {
    if (!fallingWords.trim()) return;

    try {
      const method = selectedChallenge ? 'PUT' : 'POST';
      const challengeId = selectedChallenge?.challengeId || selectedChallenge?.id;
      const url = selectedChallenge
            ? `${API_BASE}/api/challenges/falling/advanced/${challengeId}`
            : `${API_BASE}/api/challenges/falling/advanced`;

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedChallenge,
          words: fallingWords.split(',').map((word) => word.trim()),
          wrongWords: wrongWords.split(',').map((word) => word.trim()),
          testTimer: timerDuration,
          speed: fallingSpeed,
          useLives,
          maxLives: totalLives, // save lives setting
        }),
      });
 
      if (response.ok) {
        alert(
          `Advanced falling challenge ${
            selectedChallenge ? 'updated' : 'saved'
          }!`
        );
        setFallingWords('');
        setWrongWords('');
        setTimerDuration(60);
        setTotalLives(5);
        onSaved();
      } else {
        alert('Failed to save.');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };
 
  return (
    <div>
      <h3>Create an Advanced Falling Typing Challenge</h3>
      <textarea
        className="input"
        placeholder="Enter falling words separated by commas"
        value={fallingWords}
        onChange={(e) => setFallingWords(e.target.value)}
        style={{
          width: '100%',
          height: '100px',
          fontFamily: 'monospace',
        }}
      />
      <h5>Wrong Words (typing these reduces lives)</h5>
      <textarea
        className="input"
        placeholder="Enter wrong words separated by commas"
        value={wrongWords}
        onChange={(e) => setWrongWords(e.target.value)}
        style={{
          width: '100%',
          height: '60px',
          fontFamily: 'monospace',
        }}
      />
      <h5>Duration (seconds)</h5>
      <input
        type="number"
        className="input"
        value={timerDuration}
        onChange={(e) => setTimerDuration(Number(e.target.value))}
        min="10"
        style={{ width: '100%' }}
      />
      <h5>Speed (1 = normal, higher = faster)</h5>
      <input
        type="number"
        className="input"
        value={fallingSpeed}
        onChange={(e) => setFallingSpeed(Number(e.target.value))}
        min="1"
        max="5"
        style={{ width: '100%' }}
      />
      <h5>Total Lives</h5>
      <input
        type="number"
        className="input"
        min="1"
        value={totalLives}
        onChange={(e) =>
          setTotalLives(parseInt(e.target.value) || 1)
        }
        style={{ width: '100%' }}
      />
      <label style={{ display: 'block', marginTop: '8px' }}>
        <input
          type="checkbox"
          checked={useLives}
          onChange={(e) => setUseLives(e.target.checked)}
        />{' '}
        Enable Lives System
      </label>
      <button
        className="button"
        onClick={handleSave}
        style={{ marginTop: '10px' }}
      >
        {selectedChallenge ? 'Update' : 'Save'} Challenge
      </button>
    </div>
  );
}