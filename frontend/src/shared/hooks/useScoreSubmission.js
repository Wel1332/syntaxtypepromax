import { useState } from 'react';
import { getAuthToken } from '../auth/AuthUtils';
// See client.js: the backend URL is resolved at runtime, so this must not keep
// its own build-time copy.
import { API_BASE } from '../api/client';

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
      let message = data.isNewBest ? 'New best score!' : 'Score submitted!';
      if (data.rank) message += ` Rank #${data.rank}.`;
      if (data.awardedBadges && data.awardedBadges.length > 0) {
        message += ` Badge${data.awardedBadges.length > 1 ? 's' : ''} unlocked: ${data.awardedBadges.join(', ')}!`;
      }
      setSubmitMessage(message);
      setSnackbarOpen(true);
      return data;
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
