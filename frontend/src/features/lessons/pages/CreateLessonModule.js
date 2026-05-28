import React, { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

const CreateLessonModule = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleEditorChange = (content, editor) => {
    setContent(content);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting title:", title);
    console.log("Submitting content:", content);
    
    try {
      const response = await authFetch(`${API_BASE}/api/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
  
      if (response.ok) {
        const savedLesson = await response.json();
        console.log('Lesson saved successfully:', savedLesson);
        alert('Lesson submitted successfully!');
        setTitle('');
        setContent('');
      } else {
        const errorText = await response.text();
        console.error('Failed to save lesson:', response.status, errorText);
        alert('Failed to submit lesson.');
      }
    } catch (error) {
      console.error('Error submitting lesson:', error);
      alert('An error occurred while submitting the lesson.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h2>Create Lesson Module</h2>
      <input
        type="text"
        placeholder="Lesson Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', padding: '10px', fontSize: '16px', marginBottom: '1rem' }}
      />

      <Editor
        apiKey="zowa2oyra10tlma2ixy4p73zt37ztbgaounmtfvrb14zvrke" // <-- Replace with your actual TinyMCE API key
        value={content}
  init={{
    height: 400,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar:
      'undo redo | formatselect | ' +
      'bold italic underline strikethrough | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'link image media table code | removeformat | help',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',

    /* 💡 Allow local image uploads */
    automatic_uploads: true,
    file_picker_types: 'image media',
    file_picker_callback: function (cb, value, meta) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', meta.filetype === 'image' ? 'image/*' : 'video/*');
      input.onchange = function () {
        const file = this.files[0];
        const reader = new FileReader();
        reader.onload = function () {
          const id = 'blobid' + new Date().getTime();
          const base64 = reader.result.split(',')[1];
          const blobCache = window.tinymce.activeEditor.editorUpload.blobCache;
          const blobInfo = blobCache.create(id, file, reader.result);
          blobCache.add(blobInfo);
          cb(blobInfo.blobUri(), { title: file.name });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
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

export default CreateLessonModule;
