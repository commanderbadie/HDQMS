/*************************************
 DQMS – ADMIN PANEL
 Walk-In Queue + Appointments
*************************************/

import { db } from "./firebase.js";
import {
  ref,
  onValue,
  get,
  update,
  set
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* ===============================
   WALK-IN UI ELEMENTS
=============================== */
const tableBody = document.getElementById("queueTable");
const loadBtn = document.getElementById("loadBtn");
const callNextBtn = document.getElementById("callNextBtn");
const resetDayBtn = document.getElementById("resetDayBtn");
const doctorContainer = document.getElementById("doctorAvailability");

/* ===============================
   FIREBASE REFERENCES
=============================== */
const queueRef = ref(db, "queues/walkin");
const metaRef = ref(db, "queues/meta");

/* ===============================
   LOAD WALK-IN QUEUE
=============================== */
loadBtn.addEventListener("click", () => {
  listenQueue();
});

function listenQueue() {
  onValue(queueRef, (snap) => {
    tableBody.innerHTML = "";

    if (!snap.exists()) {
      tableBody.innerHTML =
        "<tr><td colspan='6'>No walk-in patients</td></tr>";
      return;
    }

    const patients = Object.values(snap.val())
      .sort((a, b) => a.createdAt - b.createdAt);

    patients.forEach((p, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${p.name}</td>
        <td>${p.phone}</td>
        <td class="${p.priority || "Normal"}">${p.priority || "Normal"}</td>
        <td class="${p.status}">${p.status}</td>
        <td>
          <button data-phone="${p.phone}" data-priority="Normal">N</button>
          <button data-phone="${p.phone}" data-priority="Moderate">M</button>
          <button data-phone="${p.phone}" data-priority="Critical">C</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });
  });
}

/* ===============================
   PRIORITY UPDATE
=============================== */
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn || !btn.dataset.phone) return;

  const snap = await get(queueRef);
  if (!snap.exists()) return;

  Object.entries(snap.val()).forEach(async ([key, p]) => {
    if (p.phone === btn.dataset.phone) {
      await update(ref(db, `queues/walkin/${key}`), {
        priority: btn.dataset.priority
      });
    }
  });
});

/* ===============================
   CALL NEXT
=============================== */
callNextBtn.addEventListener("click", async () => {
  const snap = await get(queueRef);
  if (!snap.exists()) return;

  const patients = Object.entries(snap.val())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const next = patients.find(p => p.status === "Waiting");
  if (!next) return;

  const metaSnap = await get(metaRef);
  const currentKey = metaSnap.val()?.currentServingKey;

  if (currentKey) {
    await update(ref(db, `queues/walkin/${currentKey}`), {
      status: "Completed"
    });
  }

  await update(ref(db, `queues/walkin/${next.key}`), {
    status: "Called"
  });

  await update(metaRef, {
    currentServingKey: next.key
  });
});

/* ===============================
   RESET WALK-IN DAY
=============================== */
resetDayBtn.addEventListener("click", async () => {
  if (!confirm("Reset all walk-in tokens?")) return;

  await set(queueRef, null);
  await update(metaRef, {
    currentServingKey: null,
    activeDate: new Date().toISOString().split("T")[0]
  });

  tableBody.innerHTML =
    "<tr><td colspan='6'>New day started</td></tr>";
});

/* ===============================
   DOCTOR AVAILABILITY
=============================== */
const defaultDoctorsData = {
  "General Medicine": [{ name: "Dr. Sharma", status: "Available" }],
  "Cardiology": [{ name: "Dr. Patel", status: "Busy" }]
};

let doctorsData =
  JSON.parse(localStorage.getItem("doctorsData")) || defaultDoctorsData;

localStorage.setItem("doctorsData", JSON.stringify(doctorsData));

function renderDoctorAvailability() {
  doctorContainer.innerHTML = "";

  Object.keys(doctorsData).forEach(dept => {
    const block = document.createElement("div");
    block.style.marginBottom = "12px";

    const title = document.createElement("h3");
    title.textContent = dept;
    block.appendChild(title);

    doctorsData[dept].forEach((doc, i) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";

      const name = document.createElement("span");
      name.textContent = doc.name;

      const select = document.createElement("select");
      ["Available", "Busy", "Unavailable"].forEach(status => {
        const opt = document.createElement("option");
        opt.value = status;
        opt.textContent = status;
        if (doc.status === status) opt.selected = true;
        select.appendChild(opt);
      });

      select.addEventListener("change", () => {
        doctorsData[dept][i].status = select.value;
        localStorage.setItem("doctorsData", JSON.stringify(doctorsData));
      });

      row.appendChild(name);
      row.appendChild(select);
      block.appendChild(row);
    });

    doctorContainer.appendChild(block);
  });
}

renderDoctorAvailability();

/* ===============================
   APPOINTMENT MANAGEMENT
=============================== */
const apptDateInput = document.getElementById("apptDate");
const loadAppointmentsBtn = document.getElementById("loadAppointments");
const resetAppointmentsBtn = document.getElementById("resetAppointmentsBtn");
const appointmentTable = document.getElementById("appointmentTable");

/* Auto-load on date change */
apptDateInput.addEventListener("change", () => {
  if (apptDateInput.value) loadAppointmentsBtn.click();
});

/* Load appointments */
loadAppointmentsBtn.addEventListener("click", async () => {
  const date = apptDateInput.value;
  if (!date) return;

  appointmentTable.innerHTML = "";

  const snap = await get(ref(db, `appointments/${date}`));
  if (!snap.exists()) {
    appointmentTable.innerHTML =
      "<tr><td colspan='5'>No appointments</td></tr>";
    return;
  }

  Object.entries(snap.val()).forEach(([id, appt]) => {
    if (
      appt.status === "COMPLETED" ||
      appt.status === "NO-SHOW" ||
      appt.status === "CANCELLED"
    ) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${appt.token}</td>
      <td>${appt.name}</td>
      <td>${appt.timeSlot}</td>
      <td>${appt.status}</td>
      <td>
        <button class="small-btn"
          data-id="${id}" data-date="${date}" data-status="COMPLETED">
          Complete
        </button>
        <button class="small-btn warn"
          data-id="${id}" data-date="${date}" data-status="NO-SHOW">
          No-Show
        </button>
        <button class="small-btn danger"
          data-id="${id}" data-date="${date}" data-status="CANCELLED">
          Cancel
        </button>
      </td>
    `;

    appointmentTable.appendChild(tr);
  });
});

/* Appointment action buttons */
appointmentTable.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  await update(
    ref(db, `appointments/${btn.dataset.date}/${btn.dataset.id}`),
    { status: btn.dataset.status }
  );

  const row = btn.closest("tr");
  if (row) row.remove();
});

/* ===============================
   END DAY – RESET APPOINTMENTS
=============================== */
resetAppointmentsBtn.addEventListener("click", async () => {
  const date = apptDateInput.value;
  if (!date) {
    alert("Please select a date first.");
    return;
  }

  const ok = confirm(
    `This will clear ALL appointments for ${date}.\n\nProceed?`
  );
  if (!ok) return;

  await set(ref(db, `appointments/${date}`), null);

  appointmentTable.innerHTML =
    "<tr><td colspan='5'>Appointments reset for the day.</td></tr>";
});
