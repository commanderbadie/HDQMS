/*************************************************
 DQMS – ADMIN DOCTOR CONTROL CORE
 Pure logic | No Firebase | No UI
*************************************************/

import {
  DOCTOR_STATUS,
  getDoctors
} from "./dqms-core.js";

/* ===============================
   VALIDATION
=============================== */

function isValidStatus(status) {
  return Object.values(DOCTOR_STATUS).includes(status);
}

/* ===============================
   ADMIN ACTIONS
=============================== */

/**
 * Change doctor status (logic-only)
 */
export function adminSetDoctorStatus(registry, scope, doctorId, status) {
  if (!isValidStatus(status)) {
    throw new Error("Invalid doctor status");
  }

  const doctors = getDoctors(registry, scope);
  const doctor = doctors.find(d => d.id === doctorId);

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  doctor.status = status;

  return {
    registry,
    updatedDoctor: doctor
  };
}

/* ===============================
   PATIENT VISIBILITY LOGIC
=============================== */

/**
 * Doctors visible to patients
 * Available → selectable
 * Busy → visible but locked
 * Offline → hidden
 */
export function getPatientVisibleDoctors(registry, scope) {
  const doctors = getDoctors(registry, scope);

  return doctors
    .filter(d => d.status !== DOCTOR_STATUS.OFFLINE)
    .map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      selectable: d.status === DOCTOR_STATUS.AVAILABLE
    }));
}

/* ===============================
   SAFETY CHECK
=============================== */

/**
 * Can patient join this doctor?
 */
export function canPatientJoinDoctor(registry, scope, doctorId) {
  const doctors = getDoctors(registry, scope);
  const doctor = doctors.find(d => d.id === doctorId);

  if (!doctor) return false;

  return doctor.status === DOCTOR_STATUS.AVAILABLE;
}

/* ===============================
   ADMIN DASHBOARD VIEW
=============================== */

/**
 * Full doctor snapshot for admin
 */
export function getAdminDoctorSnapshot(registry, scope) {
  const doctors = getDoctors(registry, scope);

  return doctors.map(d => ({
    id: d.id,
    name: d.name,
    status: d.status,
    canAcceptPatients: d.status === DOCTOR_STATUS.AVAILABLE
  }));
}
