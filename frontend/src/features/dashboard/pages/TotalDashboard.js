import React, { useEffect, useState } from 'react';
import '../../../css/TotalDashboard.css';
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

const TotalDashboard = () => {
  const [scores, setScores] = useState([]);
  const [avgTime, setAvgTime] = useState(0);
  const [scoreDistribution, setScoreDistribution] = useState({});
  const [highestWPM, setHighestWPM] = useState(0);
  const [lowestWPM, setLowestWPM] = useState(0);

  useEffect(() => {
    authFetch(`${API_BASE}/api/scores`)
      .then(res => res.json())
      .then(data => {
        // ✅ Filter only "normal" scores
        const normalScores = data.filter(score => score.challengeType === "normal");
        setScores(normalScores);

        const totalTime = normalScores.reduce((sum, s) => sum + s.timeInSeconds, 0);
        const avgTime = normalScores.length > 0 ? (totalTime / normalScores.length).toFixed(2) : 0;
        setAvgTime(avgTime);

        const distribution = {
          '90-100': 0,
          '80-89': 0,
          '70-79': 0,
          '60-69': 0,
          '0-59': 0,
        };

        normalScores.forEach((s) => {
          if (s.score >= 90) distribution['90-100']++;
          else if (s.score >= 80) distribution['80-89']++;
          else if (s.score >= 70) distribution['70-79']++;
          else if (s.score >= 60) distribution['60-69']++;
          else distribution['0-59']++;
        });

        setScoreDistribution(distribution);

        const wpmList = normalScores.map((s) =>
          s.wpm != null ? s.wpm : (s.timeInSeconds > 0 ? (s.score / s.timeInSeconds) * 60 : 0)
        );

        const maxWpm = wpmList.length > 0 ? Math.max(...wpmList).toFixed(2) : 0;
        const minWpm = wpmList.length > 0 ? Math.min(...wpmList).toFixed(2) : 0;

        setHighestWPM(maxWpm);
        setLowestWPM(minWpm);
      })
      .catch(err => console.error('Error fetching scores:', err));
  }, []);

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const highestScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores.map(s => s.score)) : 0;
  const averageScore = scores.length > 0 ? (totalScore / scores.length).toFixed(2) : 0;

  return (
    <div className="dashboard-container">
      <h2>Paragraph Typing Test Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card"><h3>Total Score</h3><p>{totalScore}</p></div>
        <div className="stat-card"><h3>Highest Score</h3><p>{highestScore}</p></div>
        <div className="stat-card"><h3>Lowest Score</h3><p>{lowestScore}</p></div>
        <div className="stat-card"><h3>Average Score</h3><p>{averageScore}</p></div>
        <div className="stat-card"><h3>Avg Time/Challenge (sec)</h3><p>{avgTime}</p></div>
        <div className="stat-card"><h3>Highest WPM</h3><p>{highestWPM}</p></div>
        <div className="stat-card"><h3>Lowest WPM</h3><p>{lowestWPM}</p></div>
      </div>

      <h3 style={{ marginTop: '40px' }}>Score Distribution</h3>
      <div className="distribution-grid">
        {Object.entries(scoreDistribution).map(([range, count]) => (
          <div key={range} className="distribution-card">
            <h4>{range}</h4>
            <p>{count} student{count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TotalDashboard;
