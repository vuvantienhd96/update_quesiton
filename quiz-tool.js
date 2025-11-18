let questions = [];

// DOM elements
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionList = document.getElementById("questionList");
const searchInput = document.getElementById("searchInput");
const downloadBtn = document.getElementById("downloadBtn");

// Thêm câu hỏi
addQuestionBtn.addEventListener("click", () => {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();

  if (!question || !answer) {
    alert("Vui lòng nhập cả câu hỏi và câu trả lời!");
    return;
  }

  const newItem = { question, answer };
  questions.push(newItem);

  questionInput.value = "";
  answerInput.value = "";

  renderList(questions);
});

// Render danh sách câu hỏi
function renderList(list) {
  questionList.innerHTML = "";
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "p-2 border rounded bg-gray-50 flex justify-between items-start space-x-2";

    div.innerHTML = `
      <div>
        <strong>Q:</strong> ${item.question} <br> 
        <strong>A:</strong> ${item.answer}
      </div>
      <div class="flex space-x-1">
        <button class="edit-btn bg-yellow-400 text-white px-2 py-1 rounded text-sm">Sửa</button>
        <button class="delete-btn bg-red-500 text-white px-2 py-1 rounded text-sm">Xóa</button>
      </div>
    `;

    // Xử lý sửa
    div.querySelector(".edit-btn").addEventListener("click", () => {
      questionInput.value = item.question;
      answerInput.value = item.answer;
      questions.splice(index, 1);
      renderList(questions);
    });

    // Xử lý xóa
    div.querySelector(".delete-btn").addEventListener("click", () => {
      questions.splice(index, 1);
      renderList(questions);
    });

    questionList.appendChild(div);
  });
}

// Tìm kiếm theo từ khóa (câu hỏi hoặc câu trả lời)
searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    renderList(questions);
  } else {
    const filtered = questions.filter(q =>
      q.question.toLowerCase().includes(term) ||
      q.answer.toLowerCase().includes(term)
    );
    renderList(filtered);
  }
});

// Tải file JSON chuẩn UTF-8
downloadBtn.addEventListener("click", () => {
  const json = JSON.stringify(questions, null, 2); // format đẹp, indent 2
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "questions.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});


// Import file JSON
const importJsonInput = document.getElementById("importJson");
const importBtn = document.getElementById("importBtn");

importBtn.addEventListener("click", () => {
  const file = importJsonInput.files[0];
  if (!file) {
    alert("Vui lòng chọn file JSON!");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);

      if (!Array.isArray(importedData)) {
        alert("File JSON không đúng định dạng danh sách!");
        return;
      }

      // Merge dữ liệu mới vào danh sách hiện tại
      questions = [...questions, ...importedData];

      renderList(questions);
      alert("Import thành công!");
    } catch (error) {
      alert("File JSON lỗi hoặc sai định dạng!");
    }
  };

  reader.readAsText(file, "UTF-8");
});
