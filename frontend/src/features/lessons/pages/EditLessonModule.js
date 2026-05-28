import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

const EditLessonModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API_BASE}/api/lessons/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Lesson not found');
        return res.json();
      })
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load lesson');
        navigate('/instructor'); // Redirect back to main instructor page or wherever appropriate
      });
  }, [id, navigate]);

  const handleEditorChange = (content, editor) => {
    setContent(content);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authFetch(`${API_BASE}/api/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (response.ok) {
        alert('Lesson updated successfully!');
        navigate('/instructor'); // Redirect back after saving
      } else {
        const errorText = await response.text();
        console.error('Failed to update lesson:', response.status, errorText);
        alert('Failed to update lesson.');
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      alert('An error occurred while updating the lesson.');
    }
  };

  if (loading) return <p>Loading lesson data...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Edit Lesson</h2>
      <input
        type="text"
        placeholder="Lesson Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '16px', marginBottom: '1rem' }}
      />

      <Editor
        apiKey="zowa2oyra10tlma2ixy4p73zt37ztbgaounmtfvrb14zvrke" // Replace with your TinyMCE API key
        value={content}
        init={{
          height: 400,
          menubar: true,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'code',
            'help',
            'wordcount',
          ],
          toolbar:
            'undo redo | formatselect | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'link image media table code | removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        }}
        onEditorChange={handleEditorChange}
      />

      <button
        onClick={handleSubmit}
        style={{
          marginTop: '1rem',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Save Lesson
      </button>
    </div>
  );
};

export default EditLessonModule;
