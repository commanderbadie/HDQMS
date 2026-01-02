/************************************
 AUTH.JS — EMAIL OTP VERIFICATION
************************************/

/* ===============================
   EMAILJS INITIALIZATION
=============================== */
(function () {
  emailjs.init("qOMJQzsK_ZCpQs22k");
})();

/* ===============================
   DOM ELEMENTS
=============================== */
const emailInput = document.getElementById("authEmail");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const emailMsg = document.getElementById("emailMsg");

const otpStep = document.getElementById("otpStep");
const otpInput = document.getElementById("otpInput");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const otpMsg = document.getElementById("otpMsg");

/* ===============================
   OTP STATE (IN-MEMORY)
=============================== */
let generatedOtp = null;
let otpExpiry = null;

/* ===============================
   SEND OTP
=============================== */
sendOtpBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();

  if (!email) {
    emailMsg.textContent = "Please enter a valid email address.";
    emailMsg.style.color = "red";
    return;
  }

  generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes validity

  emailjs.send(
    "service_2exlbfa",
    "template_pm66rhz",
    {
      email: email,
      otp: generatedOtp
    }
  )
  .then(() => {
    emailMsg.textContent = "OTP sent to your email.";
    emailMsg.style.color = "green";
    otpStep.style.display = "block";
  })
  .catch(() => {
    emailMsg.textContent = "Failed to send OTP. Please try again.";
    emailMsg.style.color = "red";
  });
});

/* ===============================
   VERIFY OTP
=============================== */
verifyOtpBtn.addEventListener("click", () => {
  const enteredOtp = otpInput.value.trim();

  if (!enteredOtp) {
    otpMsg.textContent = "Please enter the OTP.";
    otpMsg.style.color = "red";
    return;
  }

  if (Date.now() > otpExpiry) {
    otpMsg.textContent = "OTP expired. Please resend.";
    otpMsg.style.color = "red";
    return;
  }

  if (enteredOtp === generatedOtp) {
    otpMsg.textContent = "Email verified successfully ✔";
    otpMsg.style.color = "green";

    // 🔐 AUTH STATE (SESSION-BASED)
    sessionStorage.setItem("emailVerified", "true");
    sessionStorage.setItem("verifiedEmail", emailInput.value.trim());

    // Redirect to appointment booking
    setTimeout(() => {
      window.location.href = "book.html";
    }, 1000);

  } else {
    otpMsg.textContent = "Invalid OTP. Try again.";
    otpMsg.style.color = "red";
  }
});
