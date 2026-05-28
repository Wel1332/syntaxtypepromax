import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * StudentStatisticsPage
 *
 * Allows a student to filter stats by lesson only.
 */
const StudentStatisticsPage = () => {
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  useEffect(() => {
          const token = getAuthToken();
          if (token) {
              const id = getUserId(token);
              const role = getUserRole(token);
              setUserId(id);
              setUserRole(role);
  
              if (role !== 'STUDENT' || !id) {
                  navigate('/dashboard');
              }

              // fetch all lessons directly (since topics removed)
              fetch(`/api/student-topics/student/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((res) => res.json())
                .then(async (data) => {
                  // data is array of StudentTopicsDTOs with topicId
                  // now you need to fetch details of each topic to get names
                  const topicDetails = await Promise.all(
                    data.map((studentTopic) =>
                      fetch(`/api/topics/${studentTopic.topicId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                        .then((res) => res.json())
                        .then((detail) => detail.orElse(null)) // if using Optional in Java
                    )
                  );
                  setTopics(topicDetails.filter((t) => t !== null)); // remove nulls
                })
                .catch((err) => console.error(err));
          } else {
              navigate('/login');
          }
      }, [token, role, navigate, studentId]);

  useEffect(() => {
    if (!selectedTopic) return;

  fetch(`/api/topics/${selectedTopic}/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setLessons(data))
      .catch((err) => console.error(err));
  }, [selectedTopic, token]);

  const handleTopicChange = (e) => {
    setSelectedTopic(e.target.value);
    setSelectedLesson(""); // reset
    setStats(null);
  };

  const handleLessonChange = (e) => {
    setSelectedLesson(e.target.value);
    setStats(null);
  };

  const fetchStatistics = () => {
    if (!selectedLesson) return;

    fetch(`/api/user-statistics/lesson/${selectedLesson}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => setError("Error loading statistics."));
  };

  return (
    <div className="container">
      <h1>My Typing Statistics</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Topic Dropdown */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Choose Topic: </label>
        <select value={selectedTopic} onChange={handleTopicChange}>
          <option value="">Select a topic</option>
          {topics.map((topic) => (
            <option key={topic.topicId} value={topic.topicId}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lesson Dropdown */}
      {selectedTopic && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Choose Lesson: </label>
          <select value={selectedLesson} onChange={handleLessonChange}>
            <option value="">Select a lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.lessonId} value={lesson.lessonId}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Fetch button */}
      <button
        disabled={!selectedLesson}
        onClick={fetchStatistics}
        style={{ marginBottom: "1rem" }}
      >
        Load Statistics
      </button>

      {/* Stats display */}
      {stats && (
        <ul>
          <li>
            <strong>Words Per Minute:</strong> {stats.wordsPerMinute}
          </li>
          <li>
            <strong>Accuracy:</strong> {stats.accuracy}%
          </li>
          <li>
            <strong>Total Words Typed:</strong> {stats.totalWordsTyped}
          </li>
          <li>
            <strong>Total Time Spent:</strong> {stats.totalTimeSpent} seconds
          </li>
          <li>
            <strong>Total Errors:</strong> {stats.totalErrors}
          </li>
          <li>
            <strong>Total Tests Taken:</strong> {stats.totalTestsTaken}
          </li>
          <li>
            <strong>Fastest Clear Time:</strong> {stats.fastestClearTime} seconds
          </li>
        </ul>
      )}
    </div>
  );
};