import React, { useState } from 'react';
import './UserProfile.css';

const UserProfile = ({ userData, onLogout, onEditProfile }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Default data structure (you can modify based on your needs)
  const defaultUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    avatarUrl: "/default-avatar.png",
    joinDate: "2024-01-15",
    bio: "Passionate about algorithms and problem solving",
    location: "San Francisco, CA",
    website: "https://johndoe.dev",
    github: "johndoe",
    linkedin: "john-doe",
    
    // Coding Statistics
    stats: {
      totalSolved: 156,
      totalSubmissions: 342,
      acceptanceRate: 78.5,
      currentStreak: 15,
      maxStreak: 23,
      ranking: 1250,
      rating: 1680,
      easy: { solved: 89, total: 120 },
      medium: { solved: 54, total: 180 },
      hard: { solved: 13, total: 95 }
    },
    
    // Recent activity
    recentSubmissions: [
      { problemId: "two-sum", title: "Two Sum", status: "Accepted", date: "2024-08-19" },
      { problemId: "valid-parentheses", title: "Valid Parentheses", status: "Accepted", date: "2024-08-18" },
      { problemId: "merge-intervals", title: "Merge Intervals", status: "Wrong Answer", date: "2024-08-17" }
    ],
    
    // Achievements
    badges: [
      { id: 1, name: "Problem Solver", description: "Solved 100+ problems", icon: "🏆" },
      { id: 2, name: "Streak Master", description: "15-day solving streak", icon: "🔥" },
      { id: 3, name: "Quick Learner", description: "Solved first problem", icon: "⚡" }
    ],
    
    favoriteLanguages: ["JavaScript", "Python", "C++"]
  };

  const user = userData || defaultUser;

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#00b894';
      case 'medium': return '#fdcb6e';
      case 'hard': return '#e17055';
      default: return '#74b9ff';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Accepted': return '#00b894';
      case 'Wrong Answer': return '#e17055';
      case 'Time Limit Exceeded': return '#fdcb6e';
      default: return '#636e72';
    }
  };

  return (
    <div className="user-profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="avatar-section">
            <img 
              src={user.avatarUrl} 
              alt={`${user.name}'s avatar`}
              className="profile-avatar"
            />
            <button className="edit-avatar-btn">📷</button>
          </div>
          
          <div className="user-info-section">
            <h1 className="user-name">{user.name}</h1>
            <p className="user-email">{user.email}</p>
            <p className="user-bio">{user.bio}</p>
            
            <div className="user-meta">
              {user.location && <span className="meta-item">📍 {user.location}</span>}
              <span className="meta-item">📅 Joined {new Date(user.joinDate).toLocaleDateString()}</span>
              {user.website && <span className="meta-item">🔗 <a href={user.website} target="_blank" rel="noopener noreferrer">Website</a></span>}
            </div>
            
            <div className="social-links">
              {user.github && (
                <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="social-link">
                  GitHub
                </a>
              )}
              {user.linkedin && (
                <a href={`https://linkedin.com/in/${user.linkedin}`} target="_blank" rel="noopener noreferrer" className="social-link">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="btn btn-primary" onClick={onEditProfile}>
              Edit Profile
            </button>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-value">{user.stats.totalSolved}</div>
          <div className="stat-label">Problems Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.stats.totalSubmissions}</div>
          <div className="stat-label">Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.stats.acceptanceRate}%</div>
          <div className="stat-label">Acceptance Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user.stats.currentStreak}</div>
          <div className="stat-label">Current Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">#{user.stats.ranking}</div>
          <div className="stat-label">Global Rank</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
        <button 
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Problem Solving Progress */}
            <div className="section">
              <h3>Problem Solving Progress</h3>
              <div className="difficulty-stats">
                <div className="difficulty-stat">
                  <div className="difficulty-header">
                    <span className="difficulty-label" style={{color: getDifficultyColor('easy')}}>Easy</span>
                    <span className="difficulty-count">{user.stats.easy.solved}/{user.stats.easy.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{
                        width: `${(user.stats.easy.solved / user.stats.easy.total) * 100}%`,
                        backgroundColor: getDifficultyColor('easy')
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="difficulty-stat">
                  <div className="difficulty-header">
                    <span className="difficulty-label" style={{color: getDifficultyColor('medium')}}>Medium</span>
                    <span className="difficulty-count">{user.stats.medium.solved}/{user.stats.medium.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{
                        width: `${(user.stats.medium.solved / user.stats.medium.total) * 100}%`,
                        backgroundColor: getDifficultyColor('medium')
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="difficulty-stat">
                  <div className="difficulty-header">
                    <span className="difficulty-label" style={{color: getDifficultyColor('hard')}}>Hard</span>
                    <span className="difficulty-count">{user.stats.hard.solved}/{user.stats.hard.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{
                        width: `${(user.stats.hard.solved / user.stats.hard.total) * 100}%`,
                        backgroundColor: getDifficultyColor('hard')
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Languages */}
            <div className="section">
              <h3>Favorite Languages</h3>
              <div className="language-tags">
                {user.favoriteLanguages.map((lang, index) => (
                  <span key={index} className="language-tag">{lang}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="section">
              <h3>Recent Submissions</h3>
              <div className="submissions-list">
                {user.recentSubmissions.map((submission, index) => (
                  <div key={index} className="submission-item">
                    <div className="submission-problem">
                      <span className="problem-title">{submission.title}</span>
                    </div>
                    <div className="submission-status" style={{color: getStatusColor(submission.status)}}>
                      {submission.status}
                    </div>
                    <div className="submission-date">
                      {new Date(submission.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="section">
              <h3>Badges & Achievements</h3>
              <div className="badges-grid">
                {user.badges.map((badge) => (
                  <div key={badge.id} className="badge-card">
                    <div className="badge-icon">{badge.icon}</div>
                    <div className="badge-name">{badge.name}</div>
                    <div className="badge-description">{badge.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;


