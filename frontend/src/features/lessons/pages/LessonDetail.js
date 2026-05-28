import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

export default function LessonDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    authFetch(`${API_BASE}/api/lessons/${id}`)
      .then((res) => res.json())
      .then((data) => setLesson(data))
      .catch((err) => console.error('Error fetching lesson:', err));
  }, [id]);

  if (!lesson) return <div>Loading...</div>;

  // Sanitize HTML with custom allowed tags/attributes including <img>
  const cleanContent = DOMPurify.sanitize(lesson.content, {
    ALLOWED_TAGS: [
      'p', 'b', 'i', 'u', 'a', 'ul', 'li', 'ol',
      'strong', 'em', 'br', 'h1', 'h2', 'h3', 'h4',
      'blockquote', 'code', 'pre', 'table', 'thead',
      'tbody', 'tr', 'th', 'td', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target',
      'rel', 'style', 'class', 'id'
    ],
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        {lesson.title}
      </h1>
      <div
        style={{ lineHeight: '1.6', fontSize: '1rem' }}
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />
    </div>
  );
}
