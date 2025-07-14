const modules = ["Refrigeration", "Stress Analysis", "Turbo Machines", "Automation Control", "Design Project"];
let currentModule = modules[0];

const marksTableBody = document.querySelector("#marksTable tbody");
const moduleTitle = document.getElementById("moduleTitle");
const finalMarkEl = document.getElementById("finalMark");
const statusBadge = document.getElementById("statusBadge");
const ctx = document.getElementById("categoryChart").getContext("2d");

let marksData = {}; // Holds data loaded from localStorage

// Chart.js pie chart instance
let categoryChart;

// Initialize module tabs
function initTabs() {
  const tabsContainer = document.getElementById("moduleTabs");
  tabsContainer.innerHTML = "";
  modules.forEach(mod => {
    const btn = document.createElement("button");
    btn.innerText = mod;
    btn.className = "module-btn";
    if(mod === currentModule) btn.classList.add("active");
    btn.onclick = () => {
      currentModule = mod;
      updateActiveTab();
      loadModuleData();
    };
    tabsContainer.appendChild(btn);
  });
}

function updateActiveTab() {
  document.querySelectorAll(".module-btn").forEach(btn => {
    btn.classList.toggle("active", btn.innerText === currentModule);
  });
  moduleTitle.innerText = currentModule;
}

function saveModule() {
  // Gather data from table rows
  const rows = marksTableBody.querySelectorAll("tr");
  let arr = [];
  let totalWeight = 0;
  for(let row of rows) {
    const type = row.querySelector(".type-select").value;
    const title = row.querySelector(".title-input").value.trim();
    const date = row.querySelector(".date-input").value;
    const score = parseFloat(row.querySelector(".score-input").value);
    const weight = parseFloat(row.querySelector(".weight-input").value);

    if(!title || isNaN(score) || isNaN(weight)) {
      alert("Please fill all fields correctly.");
      return;
    }
    if(score < 0 || score > 100 || weight < 0 || weight > 100) {
      alert("Score and Weight must be between 0 and 100.");
      return;
    }

    totalWeight += weight;

    arr.push({type, title, date, score, weight});
  }
  if(Math.round(totalWeight) !== 100) {
    alert(`Total weight must equal 100%. Current total: ${totalWeight}%`);
    return;
  }

  marksData[currentModule] = arr;
  localStorage.setItem(`marks_module_${currentModule}`, JSON.stringify(arr));
  alert("Marks saved successfully!");
  updateSummary();
}

function loadModuleData() {
  marksTableBody.innerHTML = "";
  const saved = localStorage.getItem(`marks_module_${currentModule}`);
  if(saved) {
    marksData[currentModule] = JSON.parse(saved);
  } else {
    marksData[currentModule] = [];
  }
  marksData[currentModule].forEach(entry => addRow(entry));
  if(marksData[currentModule].length === 0) addRow();
  updateSummary();
}

function addRow(data = {type:"Test", title:"", date:"", score:"", weight:""}) {
  const row = document.createElement("tr");

  // Type select
  const tdType = document.createElement("td");
  const selectType = document.createElement("select");
  selectType.className = "type-select";
  ["Test","Assignment","Lab"].forEach(t => {
    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;
    if(t === data.type) option.selected = true;
    selectType.appendChild(option);
  });
  tdType.appendChild(selectType);
  row.appendChild(tdType);

  // Title input
  const tdTitle = document.createElement("td");
  const inputTitle = document.createElement("input");
  inputTitle.type = "text";
  inputTitle.className = "title-input";
  inputTitle.value = data.title;
  inputTitle.placeholder = "Name/Title";
  tdTitle.appendChild(inputTitle);
  row.appendChild(tdTitle);

  // Date input
  const tdDate = document.createElement("td");
  const inputDate = document.createElement("input");
  inputDate.type = "date";
  inputDate.className = "date-input";
  inputDate.value = data.date;
  tdDate.appendChild(inputDate);
  row.appendChild(tdDate);

  // Score input
  const tdScore = document.createElement("td");
  const inputScore = document.createElement("input");
  inputScore.type = "number";
  inputScore.min = 0;
  inputScore.max = 100;
  inputScore.className = "score-input";
  inputScore.value = data.score;
  tdScore.appendChild(inputScore);
  row.appendChild(tdScore);

  // Weight input
  const tdWeight = document.createElement("td");
  const inputWeight = document.createElement("input");
  inputWeight.type = "number";
  inputWeight.min = 0;
  inputWeight.max = 100;
  inputWeight.className = "weight-input";
  inputWeight.value = data.weight;
  tdWeight.appendChild(inputWeight);
  row.appendChild(tdWeight);

  // Action - Delete button
  const tdAction = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.title = "Delete Entry";
  delBtn.onclick = () => {
    row.remove();
    updateSummary();
  };
  tdAction.appendChild(delBtn);
  row.appendChild(tdAction);

  // Update summary when inputs change
  [selectType, inputTitle, inputDate, inputScore, inputWeight].forEach(el => {
    el.addEventListener("input", updateSummary);
  });

  marksTableBody.appendChild(row);
  updateSummary();
}

function updateSummary() {
  const data = marksData[currentModule] || [];
  const rows = marksTableBody.querySelectorAll("tr");

  // Update marksData based on current table values (to keep in sync)
  marksData[currentModule] = Array.from(rows).map(row => ({
    type: row.querySelector(".type-select").value,
    title: row.querySelector(".title-input").value.trim(),
    date: row.querySelector(".date-input").value,
    score: parseFloat(row.querySelector(".score-input").value) || 0,
    weight: parseFloat(row.querySelector(".weight-input").value) || 0
  }));

  // Calculate weighted final mark
  let finalMark = 0;
  let totalWeight = 0;

  // For pie chart data
  let categorySums = {Test:0, Assignment:0, Lab:0};
  let categoryWeights = {Test:0, Assignment:0, Lab:0};

  marksData[currentModule].forEach(e => {
    finalMark += (e.score * e.weight)/100;
    totalWeight += e.weight;
    categorySums[e.type] += e.score * e.weight;
    categoryWeights[e.type] += e.weight;
  });

  finalMark = totalWeight ? (finalMark) : 0;
  finalMarkEl.textContent = finalMark.toFixed(2) + "%";

  // Status badge and color
  statusBadge.textContent = "";
  statusBadge.className = "";

  if(finalMark < 50) {
    statusBadge.textContent = "Fail";
    statusBadge.classList.add("status-fail");
  } else if(finalMark < 75) {
    statusBadge.textContent = "Pass";
    statusBadge.classList.add("status-pass");
  } else {
    statusBadge.textContent = "Distinction";
    statusBadge.classList.add("status-distinction");
  }

  // Highlight finalMark if above 90%
  if(finalMark >= 90) {
    finalMarkEl.classList.add("top-score");
  } else {
    finalMarkEl.classList.remove("top-score");
  }

  // Pie chart data
  const chartData = {
    labels: ["Tests", "Assignments", "Labs"],
    datasets: [{
      label: "Weighted Avg Score",
      data: [
        categoryWeights.Test ? categorySums.Test/categoryWeights.Test : 0,
        categoryWeights.Assignment ? categorySums.Assignment/categoryWeights.Assignment : 0,
        categoryWeights.Lab ? categorySums.Lab/categoryWeights.Lab : 0,
      ],
      backgroundColor: [
        "#3b82f6", // blue
        "#facc15", // yellow
        "#10b981"  // green
      ],
      borderWidth: 1
    }]
  };

  if(categoryChart) {
    categoryChart.data = chartData;
    categoryChart.update();
  } else {
    categoryChart = new Chart(ctx, {
      type: "pie",
      data: chartData,
      options: {
        plugins: {
          legend: {position: 'bottom'}
        }
      }
    });
  }
}

function resetModule() {
  if(confirm(`Reset all marks for ${currentModule}? This cannot be undone.`)) {
    localStorage.removeItem(`marks_module_${currentModule}`);
    marksData[currentModule] = [];
    marksTableBody.innerHTML = "";
    addRow();
    updateSummary();
  }
}

function exportPDF() {
  import("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js").then(({ jsPDF }) => {
    const doc = new jsPDF.jsPDF();
    doc.setFontSize(18);
    doc.text(`Performance Tracker - ${currentModule}`, 10, 20);
    doc.setFontSize(14);
    doc.text(`Final Mark: ${finalMarkEl.textContent}`, 10, 30);
    doc.text(`Status: ${statusBadge.textContent}`, 10, 40);

    let y = 50;
    doc.setFontSize(12);
    doc.text("Entries:", 10, y);
    y += 10;

    const rows = marksTableBody.querySelectorAll("tr");
    rows.forEach(row => {
      if(y > 280) {
        doc.addPage();
        y = 20;
      }
      const type = row.querySelector(".type-select").value;
      const title = row.querySelector(".title-input").value;
      const date = row.querySelector(".date-input").value;
      const score = row.querySelector(".score-input").value;
      const weight = row.querySelector(".weight-input").value;
      const line = `${type} | ${title} | Date: ${date} | Score: ${score}% | Weight: ${weight}%`;
      doc.text(line, 10, y);
      y += 10;
    });

    doc.save(`Marks_${currentModule}.pdf`);
  });
}

// Initialize
initTabs();
loadModuleData();
