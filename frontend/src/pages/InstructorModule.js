import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../css/InstructorModule.css';
import { API_BASE } from '../utils/api';
import { authFetch } from '../utils/authFetch';

export default function InstructorModule() {
  const navigate = useNavigate();
 const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };
  const [lessons, setLessons] = useState([]);
  const [newLesson, setNewLesson] = useState('');
  const [activeTab, setActiveTab] = useState('wordList');
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    authFetch(`${API_BASE}/api/lessons`)
      .then((res) => res.json())
      .then((data) => {
        setLessons(data);
      })
      .catch((err) => {
        console.error('Error fetching lessons:', err);
      });
  }, []);

  const handleEditClick = (lesson) => {
    setEditingLessonId(lesson.lessonId);
    setEditedContent(lesson.content);
    setEditedTitle(lesson.title);
  };

  const handleSaveEdit = async (lessonId) => {
  try {
    const updatedLesson = {
      lessonId,
      title: editedTitle,
      content: editedContent
    };

    const response = await authFetch(`${API_BASE}/api/lessons/${lessonId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedLesson),
    });

    if (response.ok) {
      const updatedData = await response.json();
      const updatedLessons = lessons.map((lesson) =>
        lesson.lessonId === lessonId ? updatedData : lesson
      );
      setLessons(updatedLessons);
      setEditingLessonId(null);
      setEditedContent('');
      setEditedTitle('');
    } else {
      console.error("Failed to update lesson");
    }
  } catch (error) {
    console.error("Error updating lesson:", error);
  }
};


  const handleCancelEdit = () => {
    setEditingLessonId(null);
    setEditedContent('');
    setEditedTitle('');
  };

  const handleCreateLesson = async () => {
  if (newLesson.trim() === '') return;

  const newLessonObject = {
    title: newLesson,
    content: ''
  };

  try {
    const response = await authFetch(`${API_BASE}/api/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLessonObject),
    });

    if (response.ok) {
      const savedLesson = await response.json();
      setLessons([...lessons, savedLesson]); // uses backend lessonId
      setNewLesson('');
    } else {
      console.error('Failed to create lesson');
    }
  } catch (error) {
    console.error('Error creating lesson:', error);
  }
};


  const handleDeleteLesson = async (id) => {
    try {
      const response = await authFetch(`${API_BASE}/api/lessons/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setLessons(lessons.filter((lesson) => lesson.lessonId !== id));
        alert('Lesson deleted successfully');
      } else {
        alert('Failed to delete lesson');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting lesson');
    }
  };

  const handleAddWord = () => {
    if (newWord.trim() !== '') {
      setWords([...words, newWord]);
      setNewWord('');
    }
  };

  return (
    <>
     <nav className="navbar">
        <button className="hamburger-icon" onClick={toggleMenu}>☰</button>
        {isMenuOpen && (
          <div className="side-menu-overlay" onClick={toggleMenu}>
            <div className="side-menu" onClick={(e) => e.stopPropagation()}>
              <button className="close-button" onClick={toggleMenu}>×</button>
              <nav className="menu-links">
                <Link to="/typingtest" onClick={toggleMenu}>Typing Test</Link>
                <Link to="/instructor" onClick={toggleMenu}>Instructor Module</Link>
          
                <Link to="/challenges" onClick={toggleMenu}>Challenges</Link>
                <Link to="/lesson" onClick={toggleMenu}>Create Lesson</Link>
                <Link to="/lessons/all" onClick={toggleMenu}>View All Lessons</Link> 
              </nav>
            </div>
          </div>
        )}
        <div className="navbar-left">
          <h1 className="navbar-title">Instructor Module</h1>
        </div>
        <div className="navbar-right">
          <button className="nav-button" onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </nav>
    <div className="container">
      {/* Header */}
<div className="content-below-navbar">
  {/* Tabs */}
  <section>
    <div className="tab-buttons">
      <button
        className={`tab-button ${activeTab === 'challenges' ? 'active' : ''}`}
        onClick={() => navigate('/challenges')}
      >
        Challenges
      </button>
      <button
        className={`tab-button ${activeTab === 'lesson' ? 'active' : ''}`}
        onClick={() => navigate('/lesson')}
      >
        Create Lesson
      </button>
      <button
        className={`tab-button ${activeTab === 'rewards' ? 'active' : ''}`}
        onClick={() => setActiveTab('rewards')}
      >
        Custom Rewards
      </button>
    </div>

    {activeTab === 'rewards' && (
      <div className="tab-content center">[Custom Rewards Section Here]</div>
    )}
  </section>

  {/* Saved Lessons */}
  <section>
    <h2 className="section-title">Saved Lessons</h2>
    <div className="lesson-card-grid">
      {lessons.map((lesson) => (
        <div key={lesson.lessonId} className="lesson-card">
          {editingLessonId === lesson.lessonId ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="edit-title-input"
              />
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="edit-content-textarea"
              />
              <div className="button-group">
                <button className="button" onClick={() => handleSaveEdit(lesson.lessonId)}>Save</button>
                <button className="button" onClick={handleCancelEdit}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <Link to={`/lesson/view/${lesson.lessonId}`} target="_blank" rel="noopener noreferrer">
                <h3 style={{ color: 'blue', textDecoration: 'underline' }}>{lesson.title}</h3>
              </Link>

              

              <div className="button-group spaced">
                <button className="button" onClick={() => {console.log("Lesson ID:", lesson.lessonId);  navigate(`/lesson/edit/${lesson.lessonId}`)}}>Edit</button>
  <button className="button delete-button" onClick={() => handleDeleteLesson(lesson.lessonId)}>Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  </section>
</div>
</div>
</>
  );
}
