// State Management
let currentWorkout = [];
let workoutHistory = [];
let pendingWorkoutEntry = null;
let nextSessionDetails = {};

// Stopwatch State
let timerInterval;
let timerSeconds = 0;
let isTimerRunning = false;

// Health Stats Library
const strengthStats = [
    "You just triggered myofibrillar hypertrophy! Your muscles will burn extra calories for the next 24-48 hours repairing tissue.",
    "Great work! Heavy lifting stimulates osteoblast production, increasing your bone mineral density and joint strength.",
    "Your central nervous system just got a major upgrade, improving motor unit recruitment for better explosive power."
];
const cardioStats = [
    "Your mitochondria are multiplying! You've just given yourself more cellular energy for tomorrow.",
    "Your heart pumped over 5 liters of blood per minute, significantly improving your endothelial function and VO2 max.",
    "Endorphin and dopamine levels are spiking, naturally lowering your cortisol (stress) levels for a better night's sleep!"
];

// Exercise Library
const exLibrary = {
    upper: {
        squat: [
            { name: "Barbell Bench Press", target: "3 sets x 8-10 reps" },
            { name: "Standing Overhead Press", target: "3 sets x 8-10 reps" },
            { name: "Barbell Rows", target: "3 sets x 10 reps" }
        ],
        machine: [
            { name: "Machine Chest Press", target: "3 sets x 12 reps" },
            { name: "Lat Pulldowns", target: "3 sets x 12 reps" },
            { name: "Cable Tricep Pushdowns", target: "3 sets x 15 reps" },
            { name: "Seated Cable Rows", target: "3 sets x 12 reps" }
        ],
        mat: [
            { name: "Push-ups", target: "3 sets to failure" },
            { name: "Pike Push-ups", target: "3 sets x 10 reps" },
            { name: "Plank Shoulder Taps", target: "3 sets x 20 taps" }
        ]
    },
    lower: {
        squat: [
            { name: "Barbell Back Squats", target: "3 sets x 8-10 reps" },
            { name: "Romanian Deadlifts", target: "3 sets x 10 reps" },
            { name: "Front Squats", target: "3 sets x 8 reps" }
        ],
        machine: [
            { name: "Leg Press", target: "3 sets x 12 reps" },
            { name: "Hamstring Curls", target: "3 sets x 15 reps" },
            { name: "Leg Extensions", target: "3 sets x 15 reps" }
        ],
        mat: [
            { name: "Walking Lunges", target: "3 sets x 20 steps" },
            { name: "Glute Bridges", target: "3 sets x 15 reps" },
            { name: "Bicycle Crunches", target: "3 sets x 30 sec" }
        ]
    },
    cardio: {
        treadmill: [
            { name: "Treadmill HIIT", target: "Sprint 30s / Walk 60s (x8)" },
            { name: "Incline Power Walk", target: "15 mins @ 10% incline" }
        ],
        bike: [
            { name: "Heavy Resistance Spin", target: "15 mins Tabata style" },
            { name: "Endurance Ride", target: "20 mins steady state" }
        ],
        mat: [
            { name: "Burpees", target: "4 sets x 45 secs" },
            { name: "Mountain Climbers", target: "4 sets x 45 secs" },
            { name: "Jumping Jacks & High Knees", target: "5 mins continuous" }
        ]
    }
};

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const tabViews = document.querySelectorAll('.tab-view');
const getWorkoutBtn = document.getElementById('get-workout-btn');
const activeSession = document.getElementById('active-session');
const exerciseList = document.getElementById('exercise-list');
const finishWorkoutBtn = document.getElementById('finish-workout-btn');
const saveProfileBtn = document.getElementById('save-profile');
const addCustomExBtn = document.getElementById('add-custom-ex-btn');
const postWorkoutModal = document.getElementById('post-workout-modal');

// Timer DOM Elements
const timerDisplay = document.getElementById('timer-display');
const timerStart = document.getElementById('timer-start');
const timerStop = document.getElementById('timer-stop');
const timerReset = document.getElementById('timer-reset');

window.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadProfile();
    loadHistory();
    setupTimer();
});

// 1. Navigation
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

// 2. Profile
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
    alert('Profile & Equipment saved!');
});

// Helper for shuffling arrays
function shuffle(array) {
    return array.sort(() => 0.5 - Math.random());
}

// 3. Generate Workout
getWorkoutBtn.addEventListener('click', () => {
    const time = parseInt(document.getElementById('time-available').value) || 30;
    const profile = JSON.parse(localStorage.getItem('workoutProfile')) || {};
    const eq = profile.equipment || {};
    workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    
    let focusCategory = "Strength - Upper";
    if (workoutHistory[0]?.focus === "Strength - Upper") focusCategory = "Strength - Lower & Core";
    else if (workoutHistory[0]?.focus === "Strength - Lower & Core") focusCategory = "Cardio & Endurance";

    let exercises = [];
    
    // Pick from library based on equipment and focus
    if (focusCategory === "Strength - Upper") {
        if (eq.squat) exercises.push(shuffle(exLibrary.upper.squat)[0]);
        if (eq.machine) exercises = exercises.concat(shuffle(exLibrary.upper.machine).slice(0, 2));
        if (eq.mat) exercises.push(shuffle(exLibrary.upper.mat)[0]);
    } else if (focusCategory === "Strength - Lower & Core") {
        if (eq.squat) exercises.push(shuffle(exLibrary.lower.squat)[0]);
        if (eq.machine) exercises = exercises.concat(shuffle(exLibrary.lower.machine).slice(0, 2));
        if (eq.mat) exercises.push(shuffle(exLibrary.lower.mat)[0]);
    } else {
        if (eq.bike) exercises.push(shuffle(exLibrary.cardio.bike)[0]);
        if (eq.treadmill) exercises.push(shuffle(exLibrary.cardio.treadmill)[0]);
        if (eq.mat) exercises = exercises.concat(shuffle(exLibrary.cardio.mat).slice(0, 2));
    }

    // Fallback if no equipment checked
    if (exercises.length === 0) exercises = [{ name: "Bodyweight Squats", target: "3 x 15" }, { name: "Push-ups", target: "3 x 12" }, { name: "Plank", target: "3 x 45s" }];

    currentWorkout = exercises.map(ex => ({ ...ex, status: 'pending', actuals: '' }));
    
    document.getElementById('recovery-badge').innerText = focusCategory;
    document.getElementById('session-title').innerText = `${time}-Min Workout`;
    renderActiveSession();
    activeSession.classList.remove('hidden');
});

// 4. Render Active Session
function renderActiveSession() {
    exerciseList.innerHTML = '';
    currentWorkout.forEach((ex, index) => {
        const card = document.createElement('div');
        card.className = `exercise-card ${ex.status === 'completed' ? 'completed' : ''}`;
        
        let cardHTML = `<div class="ex-header"><span class="ex-title">${index + 1}. ${ex.name}</span>${ex.status === 'completed' ? '<span>✅</span>' : ''}</div><div class="ex-target">Target: ${ex.target}</div>`;

        if (ex.status === 'pending') {
            cardHTML += `
                <div class="input-group" style="margin-top: 10px; margin-bottom: 10px;">
                    <input type="number" id="log-sets-${index}" placeholder="Sets" style="padding: 10px; font-size: 0.9rem;">
                    <input type="number" id="log-reps-${index}" placeholder="Reps" style="padding: 10px; font-size: 0.9rem;">
                    <input type="number" id="log-weight-${index}" placeholder="Weight" style="padding: 10px; font-size: 0.9rem;">
                </div>
                <div class="ex-actions">
                    <button class="btn btn-success btn-sm" onclick="markDone(${index})">Save Data</button>
                    <button class="btn btn-dictate btn-sm" onclick="dictateExercise(${index})">🎤 Dictate</button>
                </div>
            `;
        } else {
            cardHTML += `<div class="ex-status">Logged: ${ex.actuals}</div><div class="ex-actions"><button class="btn btn-secondary btn-sm" onclick="editExercise(${index})">✏️ Edit Log</button></div>`;
        }
        card.innerHTML = cardHTML;
        exerciseList.appendChild(card);
    });
}

// 5. Exercise Logging Actions
window.markDone = (index) => {
    const sets = document.getElementById(`log-sets-${index}`)?.value;
    const reps = document.getElementById(`log-reps-${index}`)?.value;
    const weight = document.getElementById(`log-weight-${index}`)?.value;

    let loggedData = [];
    if (sets) loggedData.push(`${sets} sets`);
    if (reps) loggedData.push(`${reps} reps`);
    if (weight) loggedData.push(`@ ${weight}`);

    currentWorkout[index].status = 'completed';
    currentWorkout[index].actuals = loggedData.length > 0 ? loggedData.join(' x ').replace(' x @', ' @') : "Target Met";
    renderActiveSession();
};

window.editExercise = (index) => {
    currentWorkout[index].status = 'pending';
    currentWorkout[index].actuals = '';
    renderActiveSession();
};

window.dictateExercise = (index) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice not supported here."); return; }
    const recognition = new SpeechRecognition();
    recognition.onstart = () => alert("Listening... Speak reps and weight!");
    recognition.onresult = (event) => {
        currentWorkout[index].status = 'completed';
        currentWorkout[index].actuals = event.results[0][0].transcript;
        renderActiveSession();
    };
    recognition.start();
};

// 6. Manual Custom Exercise 
addCustomExBtn.addEventListener('click', () => {
    const name = document.getElementById('custom-ex-name').value;
    const sets = document.getElementById('custom-ex-sets').value;
    const reps = document.getElementById('custom-ex-reps').value;
    const weight = document.getElementById('custom-ex-weight').value;
    if (!name) return;

    let targetArr = [];
    if (sets) targetArr.push(`${sets} sets`);
    if (reps) targetArr.push(`${reps} reps`);
    if (weight) targetArr.push(`@ ${weight}`);
    const target = targetArr.length > 0 ? targetArr.join(' x ').replace(' x @', ' @') : 'Self-paced';

    currentWorkout.push({ name, target, status: 'pending', actuals: '' });
    renderActiveSession();
});

// 7. Finish Session -> Open Modal
finishWorkoutBtn.addEventListener('click', () => {
    const profile = JSON.parse(localStorage.getItem('workoutProfile')) || {};
    const time = parseInt(document.getElementById('time-available').value) || 30;
    const calories = Math.round((profile.weight || 70) * 5.5 * (time / 60));
    const currentFocus = document.getElementById('recovery-badge').innerText;

    const statArray = currentFocus.includes('Strength') ? strengthStats : cardioStats;
    const randomStat = statArray[Math.floor(Math.random() * statArray.length)];
    document.getElementById('health-stat-box').innerHTML = `<strong>📈 Did you know?</strong><br>${randomStat}<br><br><em>Est. Burn: ${calories} kcal</em>`;

    const freq = parseInt(profile.frequency) || 4;
    const daysUntilNext = Math.ceil(7 / freq);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysUntilNext);
    
    let nextFocus = "Strength - Upper";
    if (currentFocus === "Strength - Upper") nextFocus = "Strength - Lower & Core";
    else if (currentFocus === "Strength - Lower & Core") nextFocus = "Cardio & Endurance";

    nextSessionDetails = { dateStr: nextDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' }), focus: nextFocus };
    
    document.getElementById('next-session-proposal').innerText = `${nextSessionDetails.dateStr} - ${nextSessionDetails.focus}`;
    
    pendingWorkoutEntry = { date: new Date().toLocaleDateString('en-GB'), focus: currentFocus, duration: time, calories: calories, exercises: currentWorkout };
    postWorkoutModal.classList.remove('hidden');
    
    // Auto-stop timer
    if (isTimerRunning) timerStop.click();
});

// 8. Modal Actions 
document.getElementById('approve-next-btn').addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Next Session Locked In!', { body: `We will prepare your ${nextSessionDetails.focus} routine for ${nextSessionDetails.dateStr}. Rest up!`, icon: 'https://www.w3.org/TR/appmanifest/images/icon-192.png' });
            }
        });
    } else { alert("Notifications not supported in this browser environment."); }
    finalizeWorkout();
});

document.getElementById('close-modal-btn').addEventListener('click', finalizeWorkout);

function finalizeWorkout() {
    workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    workoutHistory.unshift(pendingWorkoutEntry);
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
    postWorkoutModal.classList.add('hidden');
    activeSession.classList.add('hidden');
    loadHistory();
}

// 9. Load History
function loadHistory() {
    workoutHistory = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    const historyContainer = document.getElementById('history-list');
    if (workoutHistory.length === 0) return;
    historyContainer.innerHTML = workoutHistory.map(w => `
        <div class="history-card"><strong>${w.date} - ${w.focus}</strong>
        <div class="muted-text">Duration: ${w.duration} mins | ~${w.calories} kcal burned</div>
        <ul style="margin: 5px 0 0 0; padding-left: 18px; font-size: 0.85rem;">${w.exercises.map(e => `<li>${e.name}: ${e.actuals || 'Done'}</li>`).join('')}</ul></div>
    `).join('');
}

// 10. Stopwatch Logic
function setupTimer() {
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    timerStart.addEventListener('click', () => {
        if (!isTimerRunning) {
            isTimerRunning = true;
            timerInterval = setInterval(() => {
                timerSeconds++;
                timerDisplay.innerText = formatTime(timerSeconds);
            }, 1000);
        }
    });

    timerStop.addEventListener('click', () => {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
        }
    });

    timerReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerSeconds = 0;
        timerDisplay.innerText = "00:00";
    });
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
