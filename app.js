// Elements
const saveProfileBtn = document.getElementById('save-profile');
const getWorkoutBtn = document.getElementById('get-workout-btn');
const dictateBtn = document.getElementById('dictate-btn');
const finishWorkoutBtn = document.getElementById('finish-workout-btn');
const workoutPlan = document.getElementById('workout-plan');
const historyList = document.getElementById('history-list');

let currentDictation = "";

// Load existing data on startup
window.onload = () => {
    loadProfile();
    loadHistory();
};

// 1. Profile Logic (Now includes Equipment)
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('workoutProfile'));
    if (profile) {
        document.getElementById('age').value = profile.age || '';
        document.getElementById('weight').value = profile.weight || '';
        document.getElementById('goal').value = profile.goal || 'strength';
        document.getElementById('frequency').value = profile.frequency || '4';
        
        // Load equipment (fallback to empty object if older profile exists)
        const eq = profile.equipment || {};
        document.getElementById('eq-treadmill').checked = eq.treadmill || false;
        document.getElementById('eq-bike').checked = eq.bike || false;
        document.getElementById('eq-mat').checked = eq.mat || false;
        document.getElementById('eq-machine').checked = eq.machine || false;
        document.getElementById('eq-squat').checked = eq.squat || false;
    }
}

saveProfileBtn.addEventListener('click', () => {
    const profile = {
        age: document.getElementById('age').value,
        weight: document.getElementById('weight').value,
        goal: document.getElementById('goal').value,
        frequency: document.getElementById('frequency').value,
        equipment: {
            treadmill: document.getElementById('eq-treadmill').checked,
            bike: document.getElementById('eq-bike').checked,
            mat: document.getElementById('eq-mat').checked,
            machine: document.getElementById('eq-machine').checked,
            squat: document.getElementById('eq-squat').checked
        }
    };
    localStorage.setItem('workoutProfile', JSON.stringify(profile));
    alert('Profile & Equipment Saved!');
});

// 2. Smart Workout Generator
getWorkoutBtn.addEventListener('click', () => {
    const time = document.getElementById('time-available').value;
    const profile = JSON.parse(localStorage.getItem('workoutProfile'));
    
    if (!time || !profile) {
        alert("Save your profile and enter time first.");
        return;
    }

    const eq = profile.equipment || {};
    let exercises = [];

    // Build routine based on equipment AND goals
    if (profile.goal === 'cardio' || profile.goal === 'weight_loss') {
        if (eq.treadmill) exercises.push("Interval Walk/Jog");
        if (eq.bike) exercises.push("High-Resistance Bike Intervals");
        if (eq.mat) exercises.push("Bodyweight Burpees & Mountain Climbers");
    } 
    
    if (profile.goal === 'strength' || profile.goal === 'weight_loss') {
        if (eq.squat) exercises.push("Barbell Squats & Deadlifts");
        if (eq.machine) exercises.push("Machine Chest Press & Lat Pulldowns");
        if (eq.mat) exercises.push("Core Planks & Push-ups");
    }

    // Fallback if no equipment selected
    if (exercises.length === 0) {
        exercises.push("Bodyweight Squats, Lunges, and Jumping Jacks");
    }

    workoutPlan.classList.remove('hidden');
    
    let workoutText = `⏱️ Time: ${time} Minutes\n🎯 Focus: ${profile.goal.replace('_', ' ').toUpperCase()}\n\n`;
    workoutText += `Based on your gear, focus on a circuit of:\n• ${exercises.join('\n• ')}\n\n`;
    workoutText += `Warm up for 5 mins, cycle through the exercises, and save 5 mins for cooldown.`;
    
    document.getElementById('suggested-routine').innerText = workoutText;
});

// 3. Smart Dictation
dictateBtn.addEventListener('click', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice dictation not supported on this browser.");
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.onstart = () => document.getElementById('dictation-output').innerHTML = "<em>Listening...</em>";
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        currentDictation = transcript;
        document.getElementById('dictation-output').innerHTML = `<strong>Logged:</strong> "${transcript}"`;
        finishWorkoutBtn.classList.remove('hidden');
    };
    recognition.start();
});

// 4. Finish, Calculate Health Stats & Save History
finishWorkoutBtn.addEventListener('click', () => {
    const time = document.getElementById('time-available').value;
    const profile = JSON.parse(localStorage.getItem('workoutProfile'));
    
    const calories = Math.round(profile.weight * 6 * (time / 60));
    const date = new Date().toLocaleDateString();
    
    const historyItem = {
        date: date,
        time: time,
        notes: currentDictation,
        stats: `Burned ~${calories} kcal. Great session!`
    };

    let history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    history.unshift(historyItem);
    localStorage.setItem('workoutHistory', JSON.stringify(history));
    
    loadHistory();
    workoutPlan.classList.add('hidden'); 
    currentDictation = "";
});

// 5. Display History
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    historyList.innerHTML = "";
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <strong>${item.date}</strong> - ${item.time} mins<br>
            <em>Note: ${item.notes}</em><br>
            <div class="health-stat">📈 ${item.stats}</div>
        `;
        historyList.appendChild(div);
    });
}

// 6. Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW failed', err));
    });
}
