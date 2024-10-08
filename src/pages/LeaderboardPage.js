import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import '../styles/Leaderboard.css';
import moment from 'moment-timezone';

const LeaderboardPage = () => {
    const [streaks, setStreaks] = useState([]);

    useEffect(() => {
        const fetchStreaks = async () => {
            try {
                const scoresQuery = query(
                    collection(db, 'userStreaks'),
                    orderBy('streak', 'desc'),
                    limit(10)
                );
                const querySnapshot = await getDocs(scoresQuery);
                const streaksList = querySnapshot.docs.map(doc => doc.data());
                setStreaks(streaksList);
            } catch (error) {
                console.error('Error fetching scores:', error);
            }
        };

        fetchStreaks();
    }, []);

    const formatDate = (dateString) => {
        return moment.tz(dateString, 'America/Los_Angeles').format('MM/DD/YYYY');
    };

    const formatStreak = (streak) => {
        return streak === 1 ? `${streak} day` : `${streak} days`;
    };

    return (
        <div className="leaderboard">
            <h2>Leaderboard</h2>
            <h3>Top Streaks</h3>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>User</th>
                        <th>Streak</th>
                        <th>Last Quiz</th>
                    </tr>
                </thead>
                <tbody>
                    {streaks.map((user, index) => (
                        <tr key={index} className='leadeboard=item'>
                            <td className="rank">{index === 0 ? '👑' : index + 1}</td>
                            <td className="username">{user.username || 'Unknown User'}</td>
                            <td className="streak">{formatStreak(user.streak)}</td>
                            <td className="date">
                                Last Quiz: {formatDate(user.lastQuizDate)} - Score: {user.lastQuizScore}/{10}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeaderboardPage;