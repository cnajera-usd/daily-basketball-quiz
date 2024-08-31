import React, { useState, useEffect } from 'react';
import '../styles/QuizPage.css';
import quizData from '../data/quizData.json';
import ScoreModal from '../components/ScoreModal';
import { auth } from '../firebaseConfig';
import { saveQuizScore } from '../services/quizScoreService';
import moment from 'moment-timezone';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import 'moment-timezone/data/packed/latest.json';

const QuizPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [totalPossibleScore, setTotalPossibleScore] = useState(0);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const fetchQuizData = async () => {
        try {
            const today = moment.tz('America/Los_Angeles').format('YYYY-MM-DD');
            console.log(`Calculated Today Date: ${today}`);

            const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
            const docName = `${userId}_${today}`;
            console.log(`Checking Firestore Document: ${docName}`);

            const questions = quizData[today]?.questions || [];
            if (questions.length === 0) {
                console.warn('No questions found for today’s date in quizData.');
            }
            setQuizQuestions(questions);

            let possibleScore = 0;
            questions.forEach(question => {
                switch (question.difficulty) {
                    case 'Easy':
                        possibleScore += 1;
                        break;
                    case 'Medium':
                        possibleScore += 2;
                        break;
                    case 'Hard':
                        possibleScore += 3;
                        break;
                    case 'Challenging':
                        possibleScore += 4;
                        break;
                    default:
                        possibleScore += 1;
                }
            });
            setTotalPossibleScore(possibleScore);

            const attemptDoc = await getDoc(doc(db, 'quizAttempts', docName));
            console.log(`Quiz Attempt Exists for ${docName}: ${attemptDoc.exists()}`);

            if (attemptDoc.exists()) {
                setHasAttempted(true);
                sessionStorage.setItem(`hasAttempted_${userId}_${today}`, 'true');
            }
        } catch (error) {
            console.error('Error fetching quiz data:', error);
        }
    };

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    const today = moment.tz('America/Los_Angeles').format('YYYY-MM-DD'); // Ensuring consistent date calculation

    const sessionStorageValue = sessionStorage.getItem(`hasAttempted_${userId}_${today}`);
    console.log(`Session Storage Value: ${sessionStorageValue}`);

    if (sessionStorageValue === 'true') {
        setHasAttempted(true);
    } else {
        fetchQuizData();
    }
}, []); // Ensure this effect only runs on mount

useEffect(() => {
    const saveAttempt = async () => {
        if (hasCompletedQuiz) {
            const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
            const username = auth.currentUser ? auth.currentUser.displayName || "Unknown User" : "anonymous";
            const quizDate = moment.tz('America/Los_Angeles').format('YYYY-MM-DD'); // Ensuring consistent date calculation

            await setDoc(doc(db, 'quizAttempts', `${userId}_${quizDate}`), {
                userId: userId,
                username: username,
                quizDate: quizDate,
                timestamp: moment().tz('America/Los_Angeles').format('YYYY-MM-DD HH:mm:ss') // Correct timestamp
            });

            saveQuizScore(userId, username, score, totalPossibleScore, quizDate);
            sessionStorage.setItem(`hasAttempted_${userId}_${quizDate}`, 'true');
        }
    };

    saveAttempt();
}, [hasCompletedQuiz, score, totalPossibleScore]);

const handleAnswerClick = (index) => {
    setSelectedAnswerIndex(index);
    setFeedback(null);
};

const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;

        setAnswers((prevAnswers) => ({
            ...prevAnswers,
            [currentQuestionIndex]: {
                selectedAnswerIndex,
                feedback
            },
        }));

        setCurrentQuestionIndex(nextIndex);

        const nextAnswer = answers[nextIndex];
        setSelectedAnswerIndex(nextAnswer ? nextAnswer.selectedAnswerIndex : null);
        setFeedback(nextAnswer ? nextAnswer.feedback : null);
    }
};

const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
        const prevIndex = currentQuestionIndex - 1;
        setCurrentQuestionIndex(prevIndex);

        const prevAnswer = answers[prevIndex];
        setSelectedAnswerIndex(prevAnswer ? prevAnswer.selectedAnswerIndex : null);
        setFeedback(prevAnswer ? prevAnswer.feedback : null);
    }
};

const closeScoreModal = () => {
    setShowScoreModal(false);
};

const handleSubmitAnswer = () => {
    if (hasCompletedQuiz) return;

    const isCorrect = selectedAnswerIndex === quizQuestions[currentQuestionIndex]?.correctAnswerIndex;

    setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [currentQuestionIndex]: {
            selectedAnswerIndex,
            feedback: isCorrect ? 'Correct!' : 'Incorrect.',
        },
    }));

    setFeedback(isCorrect ? 'Correct!' : 'Incorrect.');

    if (isCorrect) {
        const difficulty = quizQuestions[currentQuestionIndex]?.difficulty;
        let points = 0;

        switch (difficulty) {
            case 'Easy':
                points = 1;
                break;
            case 'Medium':
                points = 2;
                break;
            case 'Hard':
                points = 3;
                break;
            case 'Challenging':
                points = 4;
                break;
            default:
                points = 1;
        }

        setScore((prevScore) => prevScore + points);
    }

    if (currentQuestionIndex === quizQuestions.length - 1) {
        setHasCompletedQuiz(true);
        setShowScoreModal(true);
    }
};

return (
    <div className="quiz-container">
        <h1 className="quiz-title">Daily NBA Quiz</h1>
        {hasAttempted ? (
            <p>You have already taken today's quiz. Please come back tomorrow when a new quiz will be available!</p>
        ) : quizQuestions.length > 0 ? (
            <div>
                <div className="question-section">
                    <p className="question-text">
                        {quizQuestions[currentQuestionIndex]?.question}
                    </p>
                    <div className="answer-options">
                        {quizQuestions[currentQuestionIndex]?.answers.map((answer, index) => {
                            const correctAnswerIndex = quizQuestions[currentQuestionIndex]?.correctAnswerIndex;
                            const isCorrect = selectedAnswerIndex === correctAnswerIndex;

                            return (
                                <button
                                    key={index}
                                    className={`answer-button ${selectedAnswerIndex === index ? 'selected' : ''} ${feedback && index === quizQuestions[currentQuestionIndex]?.correctAnswerIndex ? 'correct' : ''} ${feedback && selectedAnswerIndex === index && !isCorrect ? 'incorrect' : ''}`}
                                    onClick={() => handleAnswerClick(index)}
                                    disabled={feedback !== null}
                                >
                                    {answer}
                                </button>
                            );
                        })}
                    </div>
                </div>
                {feedback && (
                    <p className={`feedback ${feedback.toLowerCase()}`}>{feedback}</p>
                )}
                <div className="action-buttons">
                    {currentQuestionIndex > 0 && (
                        <button className='nav-button' onClick={handlePreviousQuestion}>
                            Previous Question
                        </button>
                    )}
                    <button
                        className="nav-button submit-button"
                        onClick={handleSubmitAnswer}
                        disabled={hasCompletedQuiz}
                    >
                        Submit
                    </button>

                    {currentQuestionIndex < quizQuestions.length - 1 && (
                        <button className="nav-button" onClick={handleNextQuestion}>
                            Next Question
                        </button>
                    )}
                </div>
                {hasCompletedQuiz && (
                    <p className='final-score'>Your Final Score: {score}/{totalPossibleScore}</p>
                )}
            </div>
        ) : (
            <p>No quiz available for today. Please check back later!</p>
        )}
        {showScoreModal && (
            <ScoreModal
                score={score}
                totalQuestions={totalPossibleScore}
                onClose={closeScoreModal}
            />
        )}
    </div>
  );
};

export default QuizPage;
