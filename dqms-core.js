/*************************************************
 DQMS – CORE LOGIC ENGINE
 Hospital-grade | Deterministic | UI-agnostic
*************************************************/

/* ===============================
   DOCTOR & PATIENT STATES
=============================== */

export const DOCTOR_STATUS = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  OFFLINE: "Offline"
};

export const PATIENT_STATUS = {
  WAITING: "Waiting",
  CALLED: "Called",
  COMPLETED: "Completed",
  SKIPPED: "Skipped",
  NOSHOW: "NoShow"
};

/* ===============================
   PRIORITY MODEL
=============================== */

export const PRIORITY_WEIGHT = {
  Emergency: 4,
  Critical: 3,
  Moderate: 2,
  Normal: 1
};

/* ===============================
   TIME RULES
=============================== */

export const GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes

/* ===============================
   DOCTOR REGISTRY HELPERS
=============================== */

/**
 * registry example:
 * {
 *   OPD_GEN: [{ id, name, status, avgConsultTime }],
 *   ED: [{ id, name, status, avgConsultTime }]
 * }
 */
export function getDoctors(registry, scope) {
  return registry[scope] || [];
}

/* ===============================
   QUEUE SORTING (PRIORITY + TIME)
=============================== */

export function sortQueue(queue) {
  return queue.sort((a, b) => {
    const diff =
      PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];

    if (diff !== 0) return diff;
    return a.time - b.time;
  });
}

/* ===============================
   PATIENT ENQUEUE
=============================== */

export function enqueuePatient(queue, patient) {
  if (!patient.phone) {
    throw new Error("Patient phone is required");
  }

  if (queue.some(p => p.phone === patient.phone)) {
    throw new Error("Patient already in queue");
  }

  const entry = {
    ...patient,
    status: PATIENT_STATUS.WAITING,
    time: Date.now()
  };

  queue.push(entry);
  return sortQueue(queue);
}

/* ===============================
   POSITION CALCULATION
=============================== */

export function getPatientPosition(queue, phone) {
  const waiting = sortQueue([...queue]).filter(
    p => p.status === PATIENT_STATUS.WAITING
  );

  return waiting.findIndex(p => p.phone === phone) + 1;
}

/* ===============================
   WAIT TIME ESTIMATION
=============================== */

export function estimateWaitTime(queue, phone, avgConsultTime) {
  const sorted = sortQueue([...queue]);
  const target = sorted.find(p => p.phone === phone);

  if (!target) return 0;

  const ahead = sorted.filter(p =>
    p.status === PATIENT_STATUS.WAITING &&
    (
      PRIORITY_WEIGHT[p.priority] >
      PRIORITY_WEIGHT[target.priority] ||
      (
        PRIORITY_WEIGHT[p.priority] ===
        PRIORITY_WEIGHT[target.priority] &&
        p.time < target.time
      )
    )
  );

  return ahead.length * avgConsultTime;
}

/* ===============================
   CALL NEXT PATIENT
=============================== */

export function callNextPatient(queue) {
  const next = sortQueue(queue)
    .find(p => p.status === PATIENT_STATUS.WAITING);

  if (!next) return null;

  next.status = PATIENT_STATUS.CALLED;
  next.callTime = Date.now();

  return next;
}

/* ===============================
   NO-SHOW HANDLING
=============================== */

export function handleNoShows(queue, now = Date.now()) {
  queue.forEach(p => {
    if (
      p.status === PATIENT_STATUS.CALLED &&
      now - p.callTime > GRACE_PERIOD_MS
    ) {
      p.status = PATIENT_STATUS.NOSHOW;
    }
  });

  return queue;
}

/* ===============================
   ADMIN QUEUE ACTIONS
=============================== */

export function completePatient(queue, phone) {
  const p = queue.find(x => x.phone === phone);
  if (!p) return queue;

  p.status = PATIENT_STATUS.COMPLETED;
  return queue;
}

export function skipPatient(queue, phone) {
  const p = queue.find(x => x.phone === phone);
  if (!p) return queue;

  p.status = PATIENT_STATUS.SKIPPED;
  return queue;
}

/* ===============================
   EMERGENCY OVERRIDE
=============================== */

export function insertEmergency(queue, patient) {
  const emergency = {
    ...patient,
    priority: "Emergency",
    status: PATIENT_STATUS.WAITING,
    time: Date.now()
  };

  queue.push(emergency);
  return sortQueue(queue);
}
