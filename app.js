// 1. Hook up the buttons
const saveProfileBtn = document.getElementById('save-profile');
const dictateBtn = document.getElementById('dictate-btn');
const getWorkoutBtn = document.getElementById('get-workout-btn');
const dictationOutput = document.getElementById('dictation-output');
const suggestedRoutine = document.getElementById('suggested-routine');

// 2. Save Profile Logic
saveProfileBtn.addEventListener('click', () => {
    const age = document.getElementById('age').value;
    const weight = document.getElementById('weight').value;
    const goal = document.getElementById('goal').value;
    
    // Save to the browser's local storage
    localStorage.setItem('workoutProfile', JSON.stringify({ age, weight, goal }));
    alert('Profile Saved Successfully!');
});

// 3. Voice Dictation Logic
dictateBtn.addEventListener('click', () => {
    // Check if the browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        dictationOutput.innerHTML = "<em>Sorry, your browser doesn't support voice dictation yet.</em>";
        return;
    }
    
    const recognition = new SpeechRecognition();
    
    recognition.onstart = () => {
        dictationOutput.innerHTML = "<strong>Listening... Speak now.</strong>";
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        dictationOutput.innerHTML = `<strong>You said:</strong> "${transcript}"`;
    };
    
    recognition.start();
});

// 4. Workout Generation Logic
getWorkoutBtn.addEventListener('click', () => {
    const time = document.getElementById('time-available').value;
    const profileData = JSON.parse(localStorage.getItem('workoutProfile'));
    
    if (!time || !profileData) {
        suggestedRoutine.innerText = "Please save your profile and enter your available time first!";
        return;
    }

    let workout = "";
    
    // Create a basic plan based on the chosen goal
    if (profileData.goal === 'strength') {
        workout = `Strength Focus: Complete a ${time}-minute circuit of Push-ups, Squats, and Planks. Work for 45 seconds, rest for 15.`;
    } else if (profileData.goal === 'cardio') {
        workout = `Cardio Focus: Go for a ${time}-minute brisk walk, jog, or cycle. Try to keep your heart rate elevated!`;
    } else if (profileData.goal === 'weight_loss') {
        workout = `Weight Loss Focus: Do a ${time}-minute HIIT session. Alternate between jumping jacks, burpees, and high knees.`;
    }

    suggestedRoutine.innerText = workout;
});
// 5. Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(req => console.log('Service Worker Registered!'))
            .catch(err => console.log('Service Worker registration failed:', err));
    });
}
