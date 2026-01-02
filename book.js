/************************************
 BOOK APPOINTMENT — FINAL LOGIC (FIXED)
************************************/

import { db } from "./firebase.js";
import {
  ref,
  get,
  set,
  push
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* ===============================
   AUTH GUARD
=============================== */
if (sessionStorage.getItem("emailVerified") !== "true") {
  window.location.href = "auth.html";
}

/* ===============================
   DOM ELEMENTS (EXPLICIT — IMPORTANT)
=============================== */
const form = document.getElementById("appointmentForm");
const confirmBtn = document.getElementById("confirmBtn");

const patientNameInput = document.getElementById("patientName");
const patientEmailInput = document.getElementById("patientEmail");
const patientPhoneInput = document.getElementById("patientPhone");

const departmentSelect = document.getElementById("department");
const doctorSelect = document.getElementById("doctor");

const dateInput = document.getElementById("appointmentDate");
const timeSlotSelect = document.getElementById("timeSlot");

const confirmationBox = document.getElementById("confirmationBox");
const confirmToken = document.getElementById("confirmToken");
const confirmDate = document.getElementById("confirmDate");
const confirmTime = document.getElementById("confirmTime");

/* ===============================
   ENABLE CONFIRM BUTTON
=============================== */
confirmBtn.disabled = false;

/* ===============================
   SLOT CONFIG
=============================== */
const WORKING_HOURS = [
  { start: "10:00", end: "13:00" },
  { start: "16:00", end: "19:00" }
];

const SLOT_DURATION = 10;

/* ===============================
   TIME UTILS
=============================== */
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ===============================
   SLOT GENERATION
=============================== */
async function generateTimeSlots(date) {
  timeSlotSelect.innerHTML = "";
  timeSlotSelect.disabled = false;

  const snapshot = await get(ref(db, `appointments/${date}`));
  const booked = new Set();

  if (snapshot.exists()) {
    Object.values(snapshot.val()).forEach(a => booked.add(a.timeSlot));
  }

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Select Time Slot";
  timeSlotSelect.appendChild(defaultOpt);

  WORKING_HOURS.forEach(p => {
    let start = timeToMinutes(p.start);
    const end = timeToMinutes(p.end);

    while (start + SLOT_DURATION <= end) {
      const slot = minutesToTime(start);
      const opt = document.createElement("option");
      opt.value = slot;
      opt.textContent = slot;

      if (booked.has(slot)) {
        opt.disabled = true;
        opt.textContent += " (Booked)";
      }

      timeSlotSelect.appendChild(opt);
      start += SLOT_DURATION;
    }
  });
}

/* ===============================
   DATE CHANGE
=============================== */
dateInput.addEventListener("change", () => {
  if (dateInput.value) {
    generateTimeSlots(dateInput.value);
  }
});

/* ===============================
   TOKEN GENERATION
=============================== */
async function generateToken(date) {
  const snap = await get(ref(db, `appointments/${date}`));
  const count = snap.exists() ? Object.keys(snap.val()).length : 0;
  return `APT-${String(count + 1).padStart(3, "0")}`;
}

/* ===============================
   FORM SUBMIT (FIXED)
=============================== */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = patientNameInput.value.trim();
  const email = patientEmailInput.value.trim();
  const phone = patientPhoneInput.value.trim();
  const department = departmentSelect.value;
  const doctor = doctorSelect.value;
  const date = dateInput.value;
  const timeSlot = timeSlotSelect.value;

  if (!name || !email || !phone || !department || !doctor || !date || !timeSlot) {
    alert("Please fill all fields.");
    return;
  }

  const token = await generateToken(date);

  await set(push(ref(db, `appointments/${date}`)), {
    name,
    email,
    phone,
    department,
    doctor,
    date,
    timeSlot,
    token,
    status: "BOOKED",
    createdAt: Date.now()
  });

  confirmationBox.style.display = "block";
  confirmToken.textContent = `Token: ${token}`;
  confirmDate.textContent = `Date: ${date}`;
  confirmTime.textContent = `Time: ${timeSlot}`;

  document.getElementById("openConfirmTab").onclick = () => {
    const url = `confirm.html?token=${token}&date=${date}&time=${timeSlot}`;
    window.open(url, "_blank");
  };

  form.reset();
});
