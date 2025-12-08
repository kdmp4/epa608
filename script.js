document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quiz-container');
    const submitBtn = document.getElementById('submit-btn');
    const retryBtn = document.getElementById('retry-btn');
    const shuffleBtn = document.getElementById('shuffle-btn'); // NEW Button
    const scoreDisplay = document.getElementById('score-display');
    const scoreValue = document.getElementById('score-value');
    const scoreMessage = document.getElementById('score-message');
    
    // NEW Elements for wrong answer review
    const wrongAnswersContainer = document.getElementById('wrong-answers-container');
    const wrongAnswersList = document.getElementById('wrong-answers-list');

    let questionsData = [];

    // 1. Fetch and Parse CSV
    fetch('questions.csv')
        .then(response => response.text())
        .then(csvText => {
            questionsData = parseCSV(csvText);
            // Initial Shuffle on load
            shuffleArray(questionsData);
            renderQuiz();
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            quizContainer.innerHTML = '<p style="color:red;">Error loading questions. Please ensure questions.csv is in the same folder.</p>';
        });

    // Fisher-Yates Shuffle Algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // CSV Parser
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const line = lines[i];
            let matches = [];
            let match = regex.exec(line);
            
            while (match && matches.length < headers.length) {
                let val = match[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                matches.push(val);
                match = regex.exec(line);
            }

            if (matches.length >= 6) {
                result.push({
                    id: i,
                    question: matches[0],
                    options: {
                        A: matches[1],
                        B: matches[2],
                        C: matches[3],
                        D: matches[4]
                    },
                    answer: matches[5].toUpperCase()
                });
            }
        }
        return result;
    }

    // 2. Render Questions
    function renderQuiz() {
        quizContainer.innerHTML = '';
        questionsData.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.dataset.id = index;

            let optionsHtml = '';
            for (const [key, value] of Object.entries(q.options)) {
                if (value) {
                    optionsHtml += `
                        <label id="label-${index}-${key}">
                            <input type="radio" name="question-${index}" value="${key}">
                            <span class="opt-text">${key}. ${value}</span>
                        </label>
                    `;
                }
            }

            card.innerHTML = `
                <div class="question-text">${index + 1}. ${q.question}</div>
                <div class="options">${optionsHtml}</div>
                <div class="feedback" id="feedback-${index}"></div>
            `;
            quizContainer.appendChild(card);
        });
    }

    // NEW: Handle Shuffle Button Click
    shuffleBtn.addEventListener('click', () => {
        // Shuffle the data
        shuffleArray(questionsData);
        // Re-render the quiz (this wipes old choices)
        renderQuiz();
        // Hide results if they were open
        resetQuizState();
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 3. Handle Submission
    submitBtn.addEventListener('click', () => {
        let score = 0;
        let wrongAnswers = []; // Store incorrect questions here

        questionsData.forEach((q, index) => {
            const selected = document.querySelector(`input[name="question-${index}"]:checked`);
            const feedbackDiv = document.getElementById(`feedback-${index}`);
            const card = quizContainer.children[index];
            
            // Reset styles
            const labels = card.querySelectorAll('label');
            labels.forEach(l => l.classList.remove('correct-answer-highlight', 'wrong-answer-highlight'));
            feedbackDiv.innerHTML = '';

            let userVal = null;
            if (selected) {
                userVal = selected.value;
                if (userVal === q.answer) {
                    score++;
                    document.getElementById(`label-${index}-${userVal}`).classList.add('correct-answer-highlight');
                } else {
                    document.getElementById(`label-${index}-${userVal}`).classList.add('wrong-answer-highlight');
                    const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                    if(correctLabel) correctLabel.classList.add('correct-answer-highlight');
                    feedbackDiv.innerHTML = `<span style="color: #721c24;">Incorrect. The correct answer is ${q.answer}.</span>`;
                    
                    // Add to wrong answer list
                    wrongAnswers.push({
                        qNum: index + 1,
                        question: q.question,
                        userAnswerText: q.options[userVal],
                        correctAnswerText: q.options[q.answer]
                    });
                }
            } else {
                // No Answer
                feedbackDiv.innerHTML = `<span style="color: #721c24;">You didn't answer this question. Correct answer: ${q.answer}</span>`;
                const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                if(correctLabel) correctLabel.classList.add('correct-answer-highlight');

                // Add to wrong answer list
                wrongAnswers.push({
                    qNum: index + 1,
                    question: q.question,
                    userAnswerText: "No Answer Selected",
                    correctAnswerText: q.options[q.answer]
                });
            }
        });

        // Calculate Score
        const percentage = Math.round((score / questionsData.length) * 100);
        scoreValue.textContent = percentage;
        
        if (percentage >= 80) {
            scoreMessage.textContent = "Great job! You passed.";
            scoreMessage.style.color = "green";
        } else {
            scoreMessage.textContent = "Keep studying and try again.";
            scoreMessage.style.color = "red";
        }

        // Generate Wrong Answer Review List
        if (wrongAnswers.length > 0) {
            wrongAnswersContainer.classList.remove('hidden');
            wrongAnswersList.innerHTML = wrongAnswers.map(item => `
                <li>
                    <span class="wrong-summary-q">Q${item.qNum}: ${item.question}</span>
                    <div style="color: #721c24;"><strong>Your Answer:</strong> ${item.userAnswerText}</div>
                    <div style="color: #155724;"><strong>Correct Answer:</strong> ${item.correctAnswerText}</div>
                </li>
            `).join('');
        } else {
            // Perfect Score
            wrongAnswersContainer.classList.add('hidden');
        }

        scoreDisplay.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        retryBtn.classList.remove('hidden');
        shuffleBtn.classList.add('hidden'); // Hide shuffle during review

        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 4. Handle Retry
    retryBtn.addEventListener('click', () => {
        resetQuizState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Helper to reset UI
    function resetQuizState() {
        // Uncheck all inputs
        document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
        
        // Remove highlighting
        document.querySelectorAll('label').forEach(el => {
            el.classList.remove('correct-answer-highlight', 'wrong-answer-highlight');
        });

        // Clear feedback
        document.querySelectorAll('.feedback').forEach(el => el.innerHTML = '');

        // Hide score and wrong answers
        scoreDisplay.classList.add('hidden');
        wrongAnswersContainer.classList.add('hidden');
        
        // Buttons
        retryBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        shuffleBtn.classList.remove('hidden');
    }
});
