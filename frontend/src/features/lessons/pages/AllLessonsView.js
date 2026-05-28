import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../../css/AllLessonsView.css';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

const AllLessonsView = () => {
  const navigate = useNavigate(); // ✅ Fixed: useNavigate was not initialized
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/lessons`);
        const data = await res.json();
        setLessons(data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, []);

  return (
    <>
      {/* ✅ Navbar outside container for full-width */}
      <nav className="navbar">
        <button className="hamburger-icon" onClick={toggleMenu}>☰</button>
        {isMenuOpen && (
          <div className="side-menu-overlay" onClick={toggleMenu}>
            <div className="side-menu" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={toggleMenu}>×</button>
              <nav className="menu-links">
                <Link to="/typingtest" onClick={toggleMenu}>Typing Test</Link>
                <Link to="/instructor" onClick={toggleMenu}>Instructor</Link>
                <Link to="/fallingtypingtest" onClick={toggleMenu}>Falling Typing</Link>
                <Link to="/challenges" onClick={toggleMenu}>Challenges</Link>
                <Link to="/lesson" onClick={toggleMenu}>Create Lesson</Link>
              </nav>
            </div>
          </div>
        )}
        <div className="navbar-left">
          <h1 className="navbar-title">Challenge Creation</h1>
        </div>
        <div className="navbar-right">
          <button className="nav-button" onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </nav>

      {/* ✅ Main content below navbar */}
      <div className="all-lessons-container">
        <h2>All Saved Lessons</h2>
        {loading ? (
          <p>Loading lessons...</p>
        ) : (
          <div className="lesson-grid">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-number">{index + 1}</div>
                <h3>{lesson.title}</h3>
                <Link to={`/lessons/view/${lesson.lessonId}`} className="view-button">
                  View Full Lesson
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AllLessonsView;
