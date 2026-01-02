/*************************************************
 Firebase Admin → Doctor Status Binding
*************************************************/

import { db } from "./firebase.js";
import {
  ref,
  get,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

import {
  DOCTOR_STATUS
} from "./dqms-core.js";

import {
  adminSetDoctorStatus
} from "./dqms-admin-core.js";

/* ===============================
   PATH HELPERS
=============================== */

function doctorPath(scope, doctorId = "") {
  return doctorId
    ? `doctors/${scope}/${doctorId}`
    : `doctors/${scope}`;
}

/* ===============================
   READ DOCTORS (REAL-TIME)
=============================== */

export function listenDoctors(scope, callback) {
  const doctorsRef = ref(db, doctorPath(scope));

  onValue(doctorsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const doctors = Object.values(data);
    callback(doctors);
  });
}

/* ===============================
   ADMIN UPDATE STATUS (SAFE)
=============================== */

export async function firebaseSetDoctorStatus(
  scope,
  doctorId,
  status
) {
  if (!Object.values(DOCTOR_STATUS).includes(status)) {
    throw new Error("Invalid doctor status");
  }

  const doctorRef = ref(db, doctorPath(scope, doctorId));

  const snap = await get(doctorRef);
  if (!snap.exists()) {
    throw new Error("Doctor not found in Firebase");
  }

  // Only update status (minimal write)
  await update(doctorRef, {
    status
  });

  return true;
}

/* ===============================
   ADMIN INIT (SEED DATA)
=============================== */

export async function seedDoctors(scope, doctors) {
  const scopeRef = ref(db, doctorPath(scope));
  const payload = {};

  doctors.forEach(d => {
    payload[d.id] = d;
  });

  await set(scopeRef, payload);
}
