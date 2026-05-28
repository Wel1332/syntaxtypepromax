import { useState } from 'react';
import { getAuthToken } from '../auth/AuthUtils';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export const useScoreSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const submitScore = async (category, payload) => {
    const token = getAuthToken();
    if (!token) {
      setSubmitMessage("Please login to save your score");
      setSubmitSuccess(false);
      setSnackbarOpen(true);
      return false;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/scores/${category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to submit score');

      const data = await response.json();
      setSubmitSuccess(true);
      let message = 'Score submitted!';
      if (data.isNewBest) message = 'New best score!';
      if (data.rank) message += ` Your rank is #${data.rank}.`;
      setSubmitMessage(message);
      setSnackbarOpen(true);
      return true;
    } catch (err) {
      setSubmitSuccess(false);
      setSubmitMessage('Failed to submit score');
      setSnackbarOpen(true);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitScore, isSubmitting, submitMessage, submitSuccess, snackbarOpen, setSnackbarOpen };
};
