document.addEventListener('DOMContentLoaded', () => {
    const quizContainer = document.getElementById('quiz-container');
    const submitBtn = document.getElementById('submit-btn');
    const retryBtn = document.getElementById('retry-btn');
    const scoreDisplay = document.getElementById('score-display');
    const scoreValue = document.getElementById('score-value');
    const scoreMessage = document.getElementById('score-message');

    let questionsData = [];

    // 1. Fetch and Parse CSV
    fetch('questions.csv')
        .then(response => response.text())
        .then(csvText => {
            questionsData = parseCSV(csvText);
            // NEW: Shuffle the questions array before rendering
            shuffleArray(questionsData);
            renderQuiz();
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
            quizContainer.innerHTML = '<p style="color:red;">Error loading questions. Please ensure questions.csv is in the same folder.</p>';
        });

    // NEW: Fisher-Yates Shuffle Algorithm to randomize the array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap array[i] and array[j]
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Simple CSV Parser (Handles quoted fields)
    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const result = [];

        // Regex to handle commas inside quotes
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;

        for (let i = 1; i < lines.length; i++) {
            // Skip empty lines
            if (!lines[i].trim()) continue;

            const line = lines[i];
            let matches = [];
            let match = regex.exec(line);
            
            // Extract fields using regex
            while (match && matches.length < headers.length) {
                // Remove quotes if present
                let val = match[1].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                matches.push(val);
                match = regex.exec(line);
            }

            // Map to object structure
            if (matches.length >= 6) { // Ensure we have enough columns
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

            // HTML Structure for a question
            let optionsHtml = '';
            for (const [key, value] of Object.entries(q.options)) {
                // If the CSV has empty options (e.g. True/False), skip C and D
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

    // 3. Handle Submission
    submitBtn.addEventListener('click', () => {
        let score = 0;
        let answeredCount = 0;

        questionsData.forEach((q, index) => {
            const selected = document.querySelector(`input[name="question-${index}"]:checked`);
            const feedbackDiv = document.getElementById(`feedback-${index}`);
            const card = quizContainer.children[index];
            
            // Reset previous styling
            const labels = card.querySelectorAll('label');
            labels.forEach(l => l.classList.remove('correct-answer-highlight', 'wrong-answer-highlight'));
            feedbackDiv.innerHTML = '';

            if (selected) {
                answeredCount++;
                const userVal = selected.value;
                
                if (userVal === q.answer) {
                    score++;
                    // Highlight selected correct answer Green
                    document.getElementById(`label-${index}-${userVal}`).classList.add('correct-answer-highlight');
                } else {
                    // Highlight wrong answer Red
                    document.getElementById(`label-${index}-${userVal}`).classList.add('wrong-answer-highlight');
                    
                    // Show Correct Answer
                    const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                    if(correctLabel) correctLabel.classList.add('correct-answer-highlight');
                    
                    feedbackDiv.innerHTML = `<span style="color: #721c24;">Incorrect. The correct answer is ${q.answer}.</span>`;
                }
            } else {
                // User didn't answer
                feedbackDiv.innerHTML = `<span style="color: #721c24;">You didn't answer this question. Correct answer: ${q.answer}</span>`;
                 const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
                 if(correctLabel) correctLabel.classList.add('correct-answer-highlight');
            }
        });

        // Calculate Percentage
        const percentage = Math.round((score / questionsData.length) * 100);
        
        // Display Results
        scoreValue.textContent = percentage;
        if (percentage >= 80) {
            scoreMessage.textContent = "Great job! You passed.";
            scoreMessage.style.color = "green";
        } else {
            scoreMessage.textContent = "Keep studying and try again.";
            scoreMessage.style.color = "red";
        }

        scoreDisplay.classList.remove('hidden');
        submitBtn.classList.add('hidden');
        retryBtn.classList.remove('hidden');

        // Scroll to top to see results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 4. Handle Retry
    retryBtn.addEventListener('click', () => {
        // Uncheck all inputs
        document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
        
        // Remove highlighting classes
        document.querySelectorAll('label').forEach(el => {
            el.classList.remove('correct-answer-highlight', 'wrong-answer-highlight');
        });

        // Clear feedback text
        document.querySelectorAll('.feedback').forEach(el => el.innerHTML = '');

        // Hide score area, swap buttons
        scoreDisplay.classList.add('hidden');
        retryBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});