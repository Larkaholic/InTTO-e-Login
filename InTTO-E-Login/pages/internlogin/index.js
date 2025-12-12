const API_BASE_URL = "http://192.168.0.15:3000/api";
const INTERN_LIST_URL = `${API_BASE_URL}/internList`;

const form = document.getElementById("user-registry");
const searchBar = document.getElementById("search-bar");
const listContainer = document.getElementById("list");
const toggleButton = document.getElementById("toggle-status");
const backButton = document.getElementById('back-button');
const idNumberInput = document.getElementById('id-number');
const submitBtn = document.getElementById('submit-btn');

let selectedIntern = null;

window.onload = async () => {
  const interns = await getInternList();
  if (interns) renderInterns(interns);
  renderTime();

  setInterval(renderTime, 15000);
};

async function getInternList() {
  try {
    const response = await fetch(INTERN_LIST_URL);
    if (!response.ok) throw new Error("Failed to fetch intern list");
    return await response.json();
  } catch (err) {
    console.error("Error fetching intern list:", err);
  }
}

async function updateInternList(data, reRender = true) {
  try {
    const response = await fetch(INTERN_LIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update intern list");

    console.log("Intern list updated successfully");

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error updating intern list:", err);
  }
}

async function editIntern(fullName, updates, reRender = true) {
  try {
    const encodedName = encodeURIComponent(fullName);
    const response = await fetch(
      `http://192.168.0.15:3000/editIntern/${encodedName}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) throw new Error("Failed to edit intern");

    console.log(`Intern '${fullName}' updated successfully`);

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error editing intern:", err);
  }
}

async function deleteIntern(fullName, reRender = true) {
  try {
    const encodedName = encodeURIComponent(fullName);
    const response = await fetch(
      `http://192.168.0.15:3000/deleteIntern/${encodedName}`,
      { method: "DELETE" }
    );

    if (!response.ok) throw new Error("Failed to delete intern");

    console.log(`Intern '${fullName}' deleted successfully`);

    if (reRender) {
      const interns = await getInternList();
      if (interns) renderInterns(interns);
    }
  } catch (err) {
    console.error("Error deleting intern:", err);
  }
}

function renderInterns(interns) {
  listContainer.innerHTML = "";

  Object.entries(interns).forEach(([name, info]) => {
    const personDiv = document.createElement("div");
    personDiv.className = "person";

    const userStatus = info.status === "Time-In" ? "Time-out" : "Time-In";

    personDiv.innerHTML = `
      <div class="person-top">
        <p>${info.honorifics || "Mr."} ${info["full name"]} ${info.suffix || ""}</p>
        <p>${info.totalHours || "0"} Hours</p>
      </div>
      <div class="person-bottom">
        <p>${info.address || "No address"}</p>
        <button 
          class="Time" 
          data-name="${name}" 
          data-status="${info.status || "Time-Out"}">
          ${userStatus}
        </button>
      </div>
    `;

    personDiv.addEventListener("click", async (e) => {
      if (e.target.classList.contains("Time")) return;

      if (selectedIntern === name) {
        selectedIntern = null;
        form.reset();
        toggleCrudButtons(false);
        return;
      }

      const intern = interns[name];
      selectedIntern = name;
      form.honorifics.value = intern.honorifics || "Mr.";
      form.suffix.value = intern.suffix || "";
      form["full name"].value = name;
      form.email.value = intern.email || "";
      form.address.value = intern.address || "";
      toggleCrudButtons(true);
    });

    listContainer.appendChild(personDiv);
  });
}

function renderTime() {
  const timeEl = document.getElementById("curr-time");

  if (timeEl) {
    const now = moment();
    timeEl.textContent = now.format("hh:mm A");
  }
}

listContainer.addEventListener("click", async (event) => {
  if (event.target.classList.contains("Time")) {
    const button = event.target;
    const intern = button.dataset.name;
    const currentStatus = button.dataset.status || "Time-Out";

    const isTimeIn = currentStatus === "Time-In";
    const newStatus = isTimeIn ? "Time-Out" : "Time-In";
    const now = moment().format("hh:mm a");

    const updates = { status: newStatus };
    if (!isTimeIn) {
      updates.timeIn = now;
    } else {
      updates.timeOut = now;
    }

    button.dataset.status = newStatus;
    button.textContent = newStatus === "Time-In" ? "Time-out" : "Time-in";

    try {
      await editIntern(intern, updates, false);
      console.log(`Updated user: ${intern}`);

      const interns = await getInternList();
      if (interns) renderInterns(interns);
    } catch (err) {
      console.error(err);
    }
  }
});


form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Show scanning status
  const originalBtnText = submitBtn.value;
  submitBtn.value = 'Scanning ID...';
  submitBtn.disabled = true;

  try {
    // Scan barcode first
    const scannedId = await scanBarcodeSimple();
    idNumberInput.value = scannedId;
    
    // Then submit form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    data.honorifics = data.honorifics || "Mr.";
    data.suffix = data.suffix || "";
    data.status = "Time-In";

    const now = moment().format("hh:mm a");

    if (!data.timeIn && !data.timeOut) {
      data.logs = {
        timeIn: now,
        timeOut: ""
      };
    }

    const newName = data["full name"];

    if (selectedIntern) {
      if (selectedIntern !== newName) {
        await deleteIntern(selectedIntern, false);
        await updateInternList(data, false);

        const interns = await getInternList();
        renderInterns(interns);
      } else {
        await editIntern(selectedIntern, data);
      }
        selectedIntern = null;
    } else {
      await updateInternList(data);
    }

    form.reset();
    toggleCrudButtons(false);
    
    submitBtn.value = originalBtnText;
    submitBtn.disabled = false;
  } catch (err) {
    console.error('Error:', err);
    if (err.message !== 'Scan cancelled' && err.message !== 'No image selected') {
      alert('Failed to scan ID. Please try again.');
    }
    submitBtn.value = originalBtnText;
    submitBtn.disabled = false;
  }
});

// Simple file-based barcode scanner
async function scanBarcodeSimple() {
  return new Promise((resolve, reject) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const video = document.createElement('video');
    video.style.cssText = `
      width: 640px;
      height: 480px;
      border: 3px solid #00683F;
      border-radius: 8px;
    `;
    video.autoplay = true;

    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';

    const instructions = document.createElement('p');
    instructions.textContent = 'Hold the barcode in front of the camera';
    instructions.style.cssText = `
      color: white;
      font-size: 22px;
      margin-bottom: 20px;
      font-family: var(--font-poppins);
    `;

    const status = document.createElement('p');
    status.textContent = 'Starting camera...';
    status.style.cssText = `
      color: #ffff00;
      font-size: 18px;
      margin-top: 15px;
      font-family: var(--font-poppins);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cancel';
    closeBtn.style.cssText = `
      padding: 12px 40px;
      margin-top: 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: var(--font-poppins);
      font-size: 16px;
      font-weight: 600;
    `;

    modal.appendChild(instructions);
    modal.appendChild(video);
    modal.appendChild(canvas);
    modal.appendChild(status);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    let scanning = true;
    let stream = null;

    const cleanup = () => {
      scanning = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    closeBtn.onclick = () => {
      cleanup();
      reject(new Error('Scan cancelled'));
    };

    // Start camera
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    })
    .then(mediaStream => {
      stream = mediaStream;
      video.srcObject = mediaStream;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        status.textContent = 'Scanning... Hold barcode steady';
        
        const ctx = canvas.getContext('2d');
        
        const scanFrame = () => {
          if (!scanning) return;
          
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth",
            });
            
            if (code && code.data) {
              console.log('Scanned barcode:', code.data);
              status.textContent = `✓ Scanned: ${code.data}`;
              status.style.color = '#00ff00';
              
              setTimeout(() => {
                cleanup();
                resolve(code.data);
              }, 500);
              return;
            }
          }
          
          requestAnimationFrame(scanFrame);
        };
        
        scanFrame();
      };
    })
    .catch(err => {
      console.error('Camera error:', err);
      status.textContent = 'Camera access failed: ' + err.message;
      status.style.color = '#ff0000';
      
      setTimeout(() => {
        cleanup();
        reject(err);
      }, 2000);
    });
  });
}

backButton.addEventListener('click', () => {
  window.location.href = '../sessionpage/sessionPage.html';
});

searchBar.addEventListener("input", async () => {
  const searchTerm = searchBar.value.toLowerCase();

  const interns = await getInternList();
  if (!interns) return;

  const filtered = Object.fromEntries(
    Object.entries(interns).filter(([name]) =>
      name.toLowerCase().includes(searchTerm)
    ));

  renderInterns(filtered);
});

function toggleCrudButtons(show) {
  let updateBtn = document.getElementById("update-btn");
  let deleteBtn = document.getElementById("delete-btn");

  if (!updateBtn) {
    updateBtn = document.createElement("button");
    updateBtn.id = "update-btn";
    updateBtn.textContent = "Update Intern";
    updateBtn.type = "button";
    form.appendChild(updateBtn);
  }

  if (!deleteBtn) {
    deleteBtn = document.createElement("button");
    deleteBtn.id = "delete-btn";
    deleteBtn.textContent = "Delete Intern";
    deleteBtn.type = "button";
    deleteBtn.style.marginLeft = "10px";
    form.appendChild(deleteBtn);
  }

  updateBtn.style.display = show ? "inline-block" : "none";
  deleteBtn.style.display = show ? "inline-block" : "none";

  updateBtn.onclick = () => {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    editIntern(selectedIntern, data);
    form.reset();

    selectedIntern = null;
    toggleCrudButtons(false);
    selectedIntern = null;
  };

  deleteBtn.onclick = () => {
    if (confirm(`Are you sure you want to delete ${selectedIntern}?`)) {
      deleteIntern(selectedIntern);
      form.reset();
      toggleCrudButtons(false);
      selectedIntern = null;
    }
  };
}

document.addEventListener("click", (event) => {
  const isClickInsideForm = form.contains(event.target);
  const isClickInsideList = listContainer.contains(event.target);

  if (!isClickInsideForm && !isClickInsideList) {
    selectedIntern = null;
    form.reset();
    toggleCrudButtons(false);
  }
});