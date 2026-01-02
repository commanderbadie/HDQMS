/*************************************************
 DQMS – FIREBASE QUEUE BINDING
 Authoritative | Real-time | Safe
*************************************************/

import { db } from "./firebase.js";
import {
  ref,
  get,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* ===============================
   INTERNAL HELPERS
=============================== */

/**
 * Normalize status string
 * Handles Waiting / waiting / WAITING safely
 */
function isWaiting(status) {
  return typeof status === "string" &&
         status.toLowerCase() === "waiting";
}

/* ===============================
   REAL-TIME LISTENER
=============================== */

/**
 * Listen to a queue in real-time
 * @param {string} queueKey
 * @param {function} callback
 */
export function listenQueue(queueKey, callback) {
  const queueRef = ref(db, `queues/${queueKey}`);

  onValue(queueRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      callback([]);
      return;
    }

    // Convert object → array
    const queue = Object.values(data);

    // Sort by priority + time (defensive)
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        const weight = {
          Emergency: 4,
          Critical: 3,
          Moderate: 2,
          Normal: 1
        };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      return (a.time || 0) - (b.time || 0);
    });

    callback(queue);
  });
}

/* ===============================
   ENQUEUE PATIENT
=============================== */

/**
 * Add patient to queue
 */
export async function firebaseEnqueuePatient(queueKey, patient) {
  const patientRef = ref(
    db,
    `queues/${queueKey}/${patient.phone}`
  );

  await set(patientRef, {
    ...patient,
    status: "Waiting",
    time: Date.now()
  });
}

/* ===============================
   UPDATE PRIORITY (ADMIN)
=============================== */

/**
 * Update patient priority safely
 */
export async function firebaseUpdatePatientPriority(
  queueKey,
  phone,
  priority
) {
  const patientRef = ref(
    db,
    `queues/${queueKey}/${phone}`
  );

  await update(patientRef, {
    priority
  });
}

/* ===============================
   CALL NEXT PATIENT
=============================== */

/**
 * Call next waiting patient
 */
export async function firebaseCallNext(queueKey) {
  const queueRef = ref(db, `queues/${queueKey}`);
  const snap = await get(queueRef);

  if (!snap.exists()) return null;

  const data = snap.val();
  const patients = Object.values(data);

  const next = patients.find(p => isWaiting(p.status));
  if (!next) return null;

  const patientRef = ref(
    db,
    `queues/${queueKey}/${next.phone}`
  );

  await update(patientRef, {
    status: "Called",
    callTime: Date.now()
  });

  return next;
}

/* ===============================
   SKIP PATIENT
=============================== */

export async function firebaseSkipPatient(queueKey, phone) {
  const patientRef = ref(
    db,
    `queues/${queueKey}/${phone}`
  );

  await update(patientRef, {
    status: "Skipped"
  });
}

/* ===============================
   COMPLETE PATIENT
=============================== */

export async function firebaseCompletePatient(queueKey, phone) {
  const patientRef = ref(
    db,
    `queues/${queueKey}/${phone}`
  );

  await update(patientRef, {
    status: "Completed"
  });
}
