const fs = require('fs');

// Read the original JSON file
let jsonText = fs.readFileSync('quesition.json', 'utf8');
jsonText = jsonText.replace(/^\uFEFF/, '');
jsonText = jsonText.trim();

if (!jsonText.startsWith('[')) jsonText = '[' + jsonText;
if (jsonText.endsWith(',')) jsonText = jsonText.slice(0, -1);
if (!jsonText.endsWith(']')) jsonText = jsonText + ']';
jsonText = jsonText.replace(/,(\s*)\]$/, '$1]');

try {
    const parsed = JSON.parse(jsonText);
    console.log('JSON valid, items: ' + parsed.length);
} catch (e) {
    console.log('JSON invalid: ' + e.message);
    process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phần mềm Học tập - Trắc nghiệm</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }
        #fireworks-canvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9999;
        }
        .q-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 12px; font-weight: 600; transition: all 0.15s; }
        .q-btn.current { background: #6366f1; color: white; }
        .q-btn.correct { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .q-btn.wrong { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .q-btn.answered { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; cursor: pointer; }
        .q-btn.locked { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
    <canvas id="fireworks-canvas"></canvas>
    <div id="app" class="w-full max-w-4xl">
        <!-- Start Screen -->
        <div id="startScreen" class="text-center bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
            <div class="text-5xl mb-4">📚</div>
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Phần mềm Học tập Trắc nghiệm</h1>
            <p class="text-gray-500 mb-2">Hệ thống câu hỏi trắc nghiệm đa lĩnh vực</p>
            <p class="text-gray-600 font-medium mb-6" id="totalInfo">Đang tải...</p>
            <button onclick="startQuiz()" class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">Bắt đầu làm bài</button>
        </div>

        <!-- Quiz Screen -->
        <div id="quizScreen" class="hidden">
            <div class="flex gap-4">
                <!-- Sidebar -->
                <div class="hidden md:block w-48 bg-white rounded-2xl shadow-xl p-4 self-start sticky top-4">
                    <h3 class="text-xs font-bold text-gray-500 uppercase mb-3">Danh sách câu hỏi</h3>
                    <div id="sidebar" class="sidebar grid grid-cols-4 gap-2 max-h-[70vh] overflow-y-auto pr-1"></div>
                    <div class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-indigo-500 inline-block"></span> Đang làm</div>
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-green-200 border border-green-400 inline-block"></span> Đúng</div>
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-red-200 border border-red-400 inline-block"></span> Sai</div>
                        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded bg-gray-200 inline-block"></span> Chưa mở</div>
                    </div>
                </div>

                <!-- Main content -->
                <div class="flex-1 bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                    <div class="flex justify-between items-center mb-3">
                        <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex-1 mr-4">
                            <div id="progressFill" class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"></div>
                        </div>
                        <div id="timer" class="flex items-center gap-1 text-sm font-bold text-red-500 min-w-[60px]">
                            <span>⏱</span><span id="timerText">60s</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mb-4 text-sm">
                        <span class="text-gray-500" id="questionCounter"></span>
                        <div id="questionCategory"></div>
                    </div>
                    <h2 class="text-lg font-semibold text-gray-800 mb-2 leading-relaxed" id="questionText"></h2>
                    <p class="text-xs text-gray-400 mb-4 italic" id="hintText"></p>
                    <div class="space-y-3 mb-4" id="optionsList"></div>
                    <div id="feedback" class="hidden rounded-lg p-3 mb-4 font-medium"></div>
                    <div class="flex justify-end gap-3">
                        <button id="submitBtn" onclick="submitAnswer()" disabled class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed">Xác nhận đáp án ✓</button>
                        <button id="nextBtn" onclick="nextQuestion()" class="hidden bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 transition">Câu tiếp theo →</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Result Screen -->
        <div id="resultScreen" class="hidden bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
            <h1 class="text-2xl font-bold text-center text-gray-800 mb-4">🎯 Kết quả</h1>
            <div id="scoreCircle" class="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4">
                <span id="scoreText2" class="text-white text-2xl font-bold"></span>
            </div>
            <p class="text-center text-gray-600 text-lg mb-6" id="scoreText"></p>
            <div id="wrongList"></div>
            <div class="text-center mt-6">
                <button onclick="restartQuiz()" class="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition">🔄 Làm lại (đảo câu hỏi)</button>
            </div>
        </div>
    </div>
    <script>
    var rawData = ${jsonText};

    var questions = [];
    var currentIndex = 0;
    var score = 0;
    var answered = false;
    var wrongAnswers = [];
    var selectedOptions = [];
    var timerInterval = null;
    var timeLeft = 60;
    var answeredQuestions = []; // track status: null = locked, 'correct', 'wrong'
    var questionResults = []; // store {selected, isCorrect} for review

    function processQuestions(data) {
        var grouped = {};
        data.forEach(function(item) {
            var key = item["STT"];
            if (!grouped[key]) {
                grouped[key] = {
                    stt: item["STT"],
                    question: item["Câu hỏi"],
                    category: item["Cấu phần"] || "",
                    level: item["Mức độ"] || "",
                    options: []
                };
            }
            grouped[key].options.push({
                text: item["Phương án trả lời"],
                isCorrect: item["Đáp án đúng"] === "Y"
            });
        });
        return Object.values(grouped);
    }

    function shuffle(array) {
        var arr = array.slice();
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
        }
        return arr;
    }

    questions = processQuestions(rawData);
    document.getElementById("totalInfo").textContent = "Tổng số: " + questions.length + " câu hỏi";

    function startTimer() {
        timeLeft = 60;
        document.getElementById("timerText").textContent = "60s";
        document.getElementById("timer").className = "flex items-center gap-1 text-sm font-bold text-red-500 min-w-[60px]";
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(function() {
            timeLeft--;
            document.getElementById("timerText").textContent = timeLeft + "s";
            if (timeLeft <= 10) {
                document.getElementById("timer").className = "flex items-center gap-1 text-sm font-bold text-red-600 animate-pulse min-w-[60px]";
            }
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (!answered) { submitAnswer(true); }
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    }

    function renderSidebar() {
        var sidebar = document.getElementById("sidebar");
        sidebar.innerHTML = "";
        for (var i = 0; i < questions.length; i++) {
            (function(idx) {
                var btn = document.createElement("div");
                btn.className = "q-btn ";
                btn.textContent = (idx + 1);
                if (idx === currentIndex) {
                    btn.className += "current";
                } else if (answeredQuestions[idx] === "correct") {
                    btn.className += "correct";
                    btn.onclick = function() { reviewQuestion(idx); };
                } else if (answeredQuestions[idx] === "wrong") {
                    btn.className += "wrong";
                    btn.onclick = function() { reviewQuestion(idx); };
                } else if (answeredQuestions[idx] === "answered") {
                    btn.className += "answered";
                    btn.onclick = function() { reviewQuestion(idx); };
                } else {
                    btn.className += "locked";
                }
                sidebar.appendChild(btn);
            })(i);
        }
    }

    function reviewQuestion(idx) {
        if (idx >= currentIndex && answeredQuestions[idx] === null) return; // locked
        stopTimer();
        var q = questions[idx];
        var result = questionResults[idx];
        var total = questions.length;

        document.getElementById("progressFill").style.width = ((idx + 1) / total * 100) + "%";
        document.getElementById("questionCounter").textContent = "Câu " + (idx + 1) + " / " + total + " (xem lại)";
        document.getElementById("questionCategory").innerHTML = '<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">' + q.category + '</span> <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">' + q.level + '</span>';
        document.getElementById("questionText").textContent = q.question;
        document.getElementById("hintText").textContent = "";
        document.getElementById("timerText").textContent = "--";

        var list = document.getElementById("optionsList");
        list.innerHTML = "";
        for (var i = 0; i < q.options.length; i++) {
            var div = document.createElement("div");
            if (q.options[i].isCorrect) {
                div.className = "border-2 border-green-500 bg-green-50 text-green-800 rounded-xl p-4 text-sm leading-relaxed";
            } else if (result && result.selected.indexOf(i) > -1) {
                div.className = "border-2 border-red-500 bg-red-50 text-red-800 rounded-xl p-4 text-sm leading-relaxed";
            } else {
                div.className = "border-2 border-gray-200 rounded-xl p-4 text-sm leading-relaxed opacity-60";
            }
            div.textContent = q.options[i].text;
            list.appendChild(div);
        }

        var feedback = document.getElementById("feedback");
        if (result && result.isCorrect) {
            feedback.className = "rounded-lg p-3 mb-4 font-medium bg-green-50 text-green-700 border border-green-300";
            feedback.textContent = "✅ Đã trả lời đúng";
        } else {
            feedback.className = "rounded-lg p-3 mb-4 font-medium bg-red-50 text-red-700 border border-red-300";
            feedback.textContent = "❌ Đã trả lời sai. Đáp án đúng được tô xanh.";
        }

        document.getElementById("submitBtn").classList.add("hidden");
        // Show back button
        var nextBtn = document.getElementById("nextBtn");
        nextBtn.classList.remove("hidden");
        nextBtn.textContent = "← Quay lại câu hiện tại";
        nextBtn.onclick = function() {
            nextBtn.onclick = function() { nextQuestion(); };
            showQuestion();
        };

        // Update sidebar highlight
        renderSidebar();
        var sidebarBtns = document.getElementById("sidebar").children;
        for (var i = 0; i < sidebarBtns.length; i++) {
            if (i === idx) {
                sidebarBtns[i].className = "q-btn current";
            }
        }
    }

    function startQuiz() {
        questions = shuffle(processQuestions(rawData));
        for (var i = 0; i < questions.length; i++) {
            questions[i] = Object.assign({}, questions[i], { options: shuffle(questions[i].options) });
        }
        currentIndex = 0;
        score = 0;
        wrongAnswers = [];
        answered = false;
        selectedOptions = [];
        answeredQuestions = [];
        questionResults = [];
        for (var i = 0; i < questions.length; i++) {
            answeredQuestions.push(null);
            questionResults.push(null);
        }
        document.getElementById("startScreen").classList.add("hidden");
        document.getElementById("quizScreen").classList.remove("hidden");
        document.getElementById("resultScreen").classList.add("hidden");
        renderSidebar();
        showQuestion();
    }

    function getCorrectCount(q) {
        var count = 0;
        for (var i = 0; i < q.options.length; i++) { if (q.options[i].isCorrect) count++; }
        return count;
    }

    function showQuestion() {
        answered = false;
        selectedOptions = [];
        var q = questions[currentIndex];
        var total = questions.length;
        var correctCount = getCorrectCount(q);

        document.getElementById("progressFill").style.width = ((currentIndex + 1) / total * 100) + "%";
        document.getElementById("questionCounter").textContent = "Câu " + (currentIndex + 1) + " / " + total;
        document.getElementById("questionCategory").innerHTML = '<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">' + q.category + '</span> <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">' + q.level + '</span>';
        document.getElementById("questionText").textContent = q.question;
        document.getElementById("hintText").textContent = correctCount > 1 ? "(Chọn " + correctCount + " đáp án đúng)" : "(Chọn 1 đáp án đúng)";

        document.getElementById("feedback").className = "hidden rounded-lg p-3 mb-4 font-medium";
        document.getElementById("submitBtn").disabled = true;
        document.getElementById("submitBtn").classList.remove("hidden");
        var nextBtn = document.getElementById("nextBtn");
        nextBtn.classList.add("hidden");
        nextBtn.textContent = (currentIndex === total - 1) ? "Xem kết quả 🏆" : "Câu tiếp theo →";
        nextBtn.onclick = function() { nextQuestion(); };

        var list = document.getElementById("optionsList");
        list.innerHTML = "";
        for (var i = 0; i < q.options.length; i++) {
            (function(idx) {
                var div = document.createElement("div");
                div.className = "border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-all text-sm leading-relaxed hover:border-indigo-300 hover:bg-indigo-50";
                div.textContent = q.options[idx].text;
                div.onclick = function() { toggleOption(idx); };
                list.appendChild(div);
            })(i);
        }

        renderSidebar();
        startTimer();
    }

    function toggleOption(idx) {
        if (answered) return;
        var pos = selectedOptions.indexOf(idx);
        if (pos > -1) { selectedOptions.splice(pos, 1); }
        else { selectedOptions.push(idx); }
        var items = document.getElementById("optionsList").children;
        for (var i = 0; i < items.length; i++) {
            if (selectedOptions.indexOf(i) > -1) {
                items[i].className = "border-2 border-indigo-500 bg-indigo-50 rounded-xl p-4 cursor-pointer transition-all text-sm leading-relaxed";
            } else {
                items[i].className = "border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-all text-sm leading-relaxed hover:border-indigo-300 hover:bg-indigo-50";
            }
        }
        document.getElementById("submitBtn").disabled = (selectedOptions.length === 0);
    }

    function submitAnswer(timeUp) {
        if (answered) return;
        answered = true;
        stopTimer();

        var q = questions[currentIndex];
        var items = document.getElementById("optionsList").children;

        for (var i = 0; i < items.length; i++) {
            if (q.options[i].isCorrect) {
                items[i].className = "border-2 border-green-500 bg-green-50 text-green-800 rounded-xl p-4 text-sm leading-relaxed";
            } else if (selectedOptions.indexOf(i) > -1) {
                items[i].className = "border-2 border-red-500 bg-red-50 text-red-800 rounded-xl p-4 text-sm leading-relaxed";
            } else {
                items[i].className = "border-2 border-gray-200 rounded-xl p-4 text-sm leading-relaxed opacity-60";
            }
        }

        var isCorrect = true;
        for (var i = 0; i < q.options.length; i++) {
            if (q.options[i].isCorrect !== (selectedOptions.indexOf(i) > -1)) { isCorrect = false; break; }
        }

        // Save result
        questionResults[currentIndex] = { selected: selectedOptions.slice(), isCorrect: isCorrect };
        answeredQuestions[currentIndex] = isCorrect ? "correct" : "wrong";

        var feedback = document.getElementById("feedback");
        if (timeUp && selectedOptions.length === 0) {
            feedback.className = "rounded-lg p-3 mb-4 font-medium bg-red-50 text-red-700 border border-red-300";
            feedback.textContent = "⏱ Hết thời gian! Đáp án đúng đã được tô xanh.";
            var correctTexts = [];
            for (var i = 0; i < q.options.length; i++) { if (q.options[i].isCorrect) correctTexts.push(q.options[i].text); }
            wrongAnswers.push({ question: q.question, yourAnswer: "(Không trả lời)", correctAnswer: correctTexts.join("; ") });
            questionResults[currentIndex] = { selected: [], isCorrect: false };
            answeredQuestions[currentIndex] = "wrong";
        } else if (isCorrect) {
            score++;
            feedback.className = "rounded-lg p-3 mb-4 font-medium bg-green-50 text-green-700 border border-green-300";
            feedback.textContent = "✅ Chính xác!";
        } else {
            feedback.className = "rounded-lg p-3 mb-4 font-medium bg-red-50 text-red-700 border border-red-300";
            feedback.textContent = "❌ Sai rồi! Đáp án đúng đã được tô xanh.";
            var yourTexts = [];
            var correctTexts = [];
            for (var i = 0; i < q.options.length; i++) {
                if (selectedOptions.indexOf(i) > -1) yourTexts.push(q.options[i].text);
                if (q.options[i].isCorrect) correctTexts.push(q.options[i].text);
            }
            wrongAnswers.push({ question: q.question, yourAnswer: yourTexts.join("; "), correctAnswer: correctTexts.join("; ") });
        }

        document.getElementById("submitBtn").classList.add("hidden");
        document.getElementById("nextBtn").classList.remove("hidden");
        renderSidebar();
    }

    function nextQuestion() {
        currentIndex++;
        if (currentIndex >= questions.length) { showResult(); }
        else { showQuestion(); }
    }

    function showResult() {
        stopTimer();
        document.getElementById("quizScreen").classList.add("hidden");
        document.getElementById("resultScreen").classList.remove("hidden");
        var total = questions.length;
        var percent = Math.round(score / total * 100);
        document.getElementById("scoreText2").textContent = score + "/" + total;
        var circle = document.getElementById("scoreCircle");
        if (percent >= 80) circle.className = "w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600";
        else if (percent >= 50) circle.className = "w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500";
        else circle.className = "w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-red-400 to-red-600";
        document.getElementById("scoreText").innerHTML = "Bạn đạt <strong>" + percent + "%</strong> (" + score + " đúng / " + total + " câu)";
        var wrongList = document.getElementById("wrongList");
        if (wrongAnswers.length === 0) {
            wrongList.innerHTML = '<p class="text-center text-green-600 font-semibold text-lg">🎉 Xuất sắc! Bạn trả lời đúng tất cả!</p>';
        } else {
            var html = '<h3 class="text-red-700 font-semibold mb-3">📋 Các câu trả lời sai (' + wrongAnswers.length + ' câu):</h3><div class="max-h-80 overflow-y-auto space-y-3">';
            for (var i = 0; i < wrongAnswers.length; i++) {
                html += '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><p class="font-semibold text-gray-800 mb-2">' + (i+1) + '. ' + wrongAnswers[i].question + '</p><p class="text-red-600 text-sm">❌ Bạn chọn: ' + wrongAnswers[i].yourAnswer + '</p><p class="text-green-600 text-sm">✅ Đáp án đúng: ' + wrongAnswers[i].correctAnswer + '</p></div>';
            }
            html += '</div>';
            wrongList.innerHTML = html;
        }
        // Launch fireworks!
        launchFireworks();
        setTimeout(function() {
            alert("=)) Tool học tập dành cho phú bà họ Phan Thị");
        }, 5000);
    }

    function launchFireworks() {
        var canvas = document.getElementById("fireworks-canvas");
        var ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.display = "block";

        var particles = [];
        var rockets = [];
        var startTime = Date.now();
        var duration = 5000;

        function random(min, max) { return Math.random() * (max - min) + min; }

        function createExplosion(x, y) {
            var colors = ["#ff0", "#f0f", "#0ff", "#f00", "#0f0", "#ff6600", "#ff69b4", "#7b68ee", "#00ff7f"];
            var count = Math.floor(random(30, 60));
            for (var i = 0; i < count; i++) {
                var angle = (Math.PI * 2 / count) * i;
                var speed = random(2, 7);
                particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    decay: random(0.01, 0.03),
                    color: colors[Math.floor(random(0, colors.length))],
                    size: random(2, 4)
                });
            }
        }

        function createRocket() {
            rockets.push({
                x: random(canvas.width * 0.2, canvas.width * 0.8),
                y: canvas.height,
                vy: random(-12, -8),
                targetY: random(canvas.height * 0.1, canvas.height * 0.4),
                exploded: false
            });
        }

        var lastRocket = 0;
        function animate() {
            var elapsed = Date.now() - startTime;
            if (elapsed > duration && particles.length === 0 && rockets.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.style.display = "none";
                return;
            }

            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Launch rockets periodically
            if (elapsed < duration && Date.now() - lastRocket > 300) {
                createRocket();
                lastRocket = Date.now();
            }

            // Update rockets
            for (var r = rockets.length - 1; r >= 0; r--) {
                var rocket = rockets[r];
                rocket.y += rocket.vy;
                // Draw rocket trail
                ctx.beginPath();
                ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.fill();
                if (rocket.y <= rocket.targetY) {
                    createExplosion(rocket.x, rocket.y);
                    rockets.splice(r, 1);
                }
            }

            // Update particles
            for (var p = particles.length - 1; p >= 0; p--) {
                var part = particles[p];
                part.x += part.vx;
                part.y += part.vy;
                part.vy += 0.1; // gravity
                part.life -= part.decay;
                if (part.life <= 0) { particles.splice(p, 1); continue; }
                ctx.globalAlpha = part.life;
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                ctx.fillStyle = part.color;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            requestAnimationFrame(animate);
        }
        animate();
    }

    function restartQuiz() {
        document.getElementById("resultScreen").classList.add("hidden");
        startQuiz();
    }
    <\/script>
</body>
</html>`;

fs.writeFileSync('index.html', html, 'utf8');
console.log('Build complete! index.html size: ' + Buffer.byteLength(html, 'utf8') + ' bytes');
