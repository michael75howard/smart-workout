// State Management
let currentWorkout = [];
let workoutHistory = [];

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const tabViews = document.querySelectorAll('.tab-view');
const getWorkoutBtn = document.getElementById('get-workout-btn');
const activeSession = document.getElementById('active-session');
const exerciseList = document.getElementById('exercise-list');
const finishWorkoutBtn = document.getElementById('finish-workout-btn');
const saveProfileBtn = document.getElementById('save-profile');
const addCustomExBtn = document.getElementById('add-custom-ex-btn');

// Startup Initialization
window.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadProfile();
    loadHistory();
});

// 1. Bottom Tab Navigation Switcher
function setupNavigation() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            
            navBtns.forEach(b => b.classList.remove('active'));
            tabViews.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

// 2. Load & Save Profile Settings
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('workoutProfile')) || {};
    document.getElementById('age').value = profile.age || '';
    document.getElementById('weight').value = profile.weight || '';
    document.getElementById('goal').value = profile.goal || 'strength';
    document.getElementById('frequency').value = profile.frequency || '4';

    const eq = profile.equipment || {};
    document.getElementById('eq-treadmill').checked = eq.treadmill || false;
    document.getElementById('eq-bike').checked = eq.bike || false;
    document.getElementById('eq-mat').checked = eq.mat || false;
    document.getElementById('eq-machine').checked = eq.machine || false;
    document.getElementById('eq-squat').checked = eq.squat || false;
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
    alert('Profile & Equipment preferences saved!');
});

// 3. Smart Plan Generator (Recovery-Aware)
getWorkoutBtn.addEventListener('click', () => {
    const time = parseInt(document.getElementById('time-available').value) || 30;
    const profile = JSON.parse(localStorage.getItem('workoutProfile')) || {};
    const eq = profile.equipment || {};
    
    workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    const lastWorkout = workoutHistory[0];

    // Determine target focus allowing for recovery
    let focusCategory = "Strength - Upper";
    if (lastWorkout && lastWorkout.focus === "Strength - Upper") {
        focusCategory = "Strength - Lower & Core";
    } else if (lastWorkout && lastWorkout.focus === "Strength - Lower & Core") {
        focusCategory = "Cardio & Endurance";
    }

    let generatedExercises = [];

    if (focusCategory === "Strength - Upper") {
        if (eq.squat) generatedExercises.push({ name: "Barbell Bench Press / Overhead Press", target: "3 sets x 8-10 reps @ moderate weight" });
        if (eq.machine) generatedExercises.push({ name: "Chest Flyes / Lat Pulldowns", target: "3 sets x 12 reps" });
        if (eq.mat) generatedExercises.push({ name: "Push-ups & Core Planks", target: "3 sets x 15 reps / 45 sec plank" });
    } else if (focusCategory === "Strength - Lower & Core") {
        if (eq.squat) generatedExercises.push({ name: "Barbell Squats or Romanian Deadlifts", target: "3 sets x 8-10 reps" });
        if (eq.machine) generatedExercises.push({ name: "Leg Press & Hamstring Curls", target: "3 sets x 12 reps" });
        if (eq.mat) generatedExercises.push({ name: "Bodyweight Lunges & Leg Raises", target: "3 sets x 15 reps each" });
    } else {
        if (eq.bike) generatedExercises.push({ name: "Indoor Bike Interval Sprint", target: `${Math.round(time * 0.5)} mins HIIT cycle` });
        if (eq.treadmill) generatedExercises.push({ name: "Treadmill Walk/Jog", target: `${Math.round(time * 0.5)} mins steady state` });
        if (eq.mat) generatedExercises.push({ name: "Burpees & Mountain Climbers", target: "4 rounds x 45 secs" });
    }

    // Fallback if no equipment is checked
    if (generatedExercises.length === 0) {
        generatedExercises = [
            { name: "Bodyweight Squats", target: "3 sets x 15 reps" },
            { name: "Push-ups", target: "3 sets x 12 reps" },
            { name: "Plank Hold", target: "3 sets x 45 seconds" }
        ];
    }

    currentWorkout = generatedExercises.map(ex => ({ ...ex, status: 'pending', actuals: '' }));
    
    document.getElementById('recovery-badge').innerText = `Recovery Focus: ${focusCategory}`;
    document.getElementById('session-title').innerText = `${time}-Min Workout Session`;
    document.getElementById('session-desc').innerText = `Frequency target: ${profile.frequency || 4} days/week.`;

    renderActiveSession();
    activeSession.classList.remove('hidden');
});

// 4. Render Interactive Exercise Checklist
function renderActiveSession() {
    exerciseList.innerHTML = '';

    currentWorkout.forEach((ex, index) => {
        const card = document.createElement('div');
        card.className = `exercise-card ${ex.status === 'completed' ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="ex-header">
                <span class="ex-title">${index + 1}. ${ex.name}</span>
                ${ex.status === 'completed' ? '<span>✅</span>' : ''}
            </div>
            <div class="ex-target">Target: ${ex.target}</div>
            ${ex.actuals ? `<div class="ex-status">Logged: ${ex.actuals}</div>` : ''}
            <div class="ex-actions">
                <button class="btn btn-success btn-sm" onclick="markDone(${index})">Yes! Done!</button>
                <button class="btn btn-dictate btn-sm" onclick="dictateExercise(${index})">🎤 Dictate Result</button>
            </div>
        `;
        exerciseList.appendChild(card);
    });
}

// 5. Interactively Mark Exercise as Done or Dictate Prompt
window.markDone = (index) => {
    currentWorkout[index].status = 'completed';
    currentWorkout[index].actuals = currentWorkout[index].actuals || "Target Met (100%)";
    renderActiveSession();
};

window.dictateExercise = (index) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        const manualInput = prompt(`Enter what you did for ${currentWorkout[index].name} (e.g. 10 reps @ 25kg or 12 mins):`);
        if (manualInput) {
            currentWorkout[index].status = 'completed';
            currentWorkout[index].actuals = manualInput;
            renderActiveSession();
        }
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.onstart = () => alert("Listening... Speak your reps/weight/minutes now!");
    recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        currentWorkout[index].status = 'completed';
        currentWorkout[index].actuals = result;
        renderActiveSession();
    };
    recognition.start();
};

// 6. Manual Custom Exercise Injection
addCustomExBtn.addEventListener('click', () => {
    const name = document.getElementById('custom-ex-name').value;
    const target = document.getElementById('custom-ex-target').value;

    if (!name) {
        alert('Please type an exercise name.');
        return;
    }

    currentWorkout.push({ name, target: target || 'Self-paced', status: 'pending', actuals: '' });
    document.getElementById('custom-ex-name').value = '';
    document.getElementById('custom-ex-target').value = '';
    renderActiveSession();
});

// 7. Save Finished Workout to History
finishWorkoutBtn.addEventListener('click', () => {
    const profile = JSON.parse(localStorage.getItem('workoutProfile')) || {};
    const weight = profile.weight || 70;
    const time = parseInt(document.getElementById('time-available').value) || 30;
    const estimatedCalories = Math.round(weight * 5.5 * (time / 60));

    const workoutEntry = {
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        focus: document.getElementById('recovery-badge').innerText.replace('Recovery Focus: ', ''),
        duration: time,
        calories: estimatedCalories,
        exercises: currentWorkout
    };

    workoutHistory.unshift(workoutEntry);
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));

    alert(`🎉 Workout Saved! You burned approximately ${estimatedCalories} calories.`);
    activeSession.classList.add('hidden');
    loadHistory();
});

// 8. Load History Tab Content
function loadHistory() {
    workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    const historyContainer = document.getElementById('history-list');

    if (workoutHistory.length === 0) {
        historyContainer.innerHTML = `<p class="muted-text">No workouts logged yet. Complete a session on the main page!</p>`;
        return;
    }

    historyContainer.innerHTML = workoutHistory.map(w => `
        <div class="history-card">
            <strong>${w.date} - ${w.focus}</strong>
            <div class="muted-text">Duration: ${w.duration} mins | ~${w.calories} kcal burned</div>
            <ul style="margin: 5px 0 0 0; padding-left: 18px; font-size: 0.85rem;">
                ${w.exercises.map(e => `<li>${e.name}: ${e.actuals || 'Done'}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW Registration Failed', err));
    });
}
