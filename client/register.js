const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

let otpVerified = false;

const mobileInput = document.getElementById("mobile");


// ===============================
// SEND OTP BUTTON
// ===============================

const sendOtpButton = document.createElement("button");

sendOtpButton.type = "button";
sendOtpButton.textContent = "Send OTP";

mobileInput.insertAdjacentElement("afterend", sendOtpButton);


// ===============================
// OTP INPUT
// ===============================

const otpInput = document.createElement("input");

otpInput.type = "text";
otpInput.placeholder = "Enter 6-digit OTP";
otpInput.maxLength = 6;
otpInput.inputMode = "numeric";


// ===============================
// VERIFY OTP BUTTON
// ===============================

const verifyOtpButton = document.createElement("button");

verifyOtpButton.type = "button";
verifyOtpButton.textContent = "Verify OTP";


// Initially hide OTP section

otpInput.style.display = "none";
verifyOtpButton.style.display = "none";


// Add OTP elements to page

sendOtpButton.insertAdjacentElement("afterend", otpInput);
otpInput.insertAdjacentElement("afterend", verifyOtpButton);


// ===============================
// SEND OTP
// ===============================

sendOtpButton.addEventListener("click", async () => {

    const mobile = mobileInput.value.trim();

    if (!/^[6-9][0-9]{9}$/.test(mobile)) {

        message.textContent =
            "Please enter a valid 10-digit mobile number.";

        return;
    }


    try {

        const response = await fetch("/api/send-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                mobile: mobile
            })

        });


        const data = await response.json();


        message.textContent = data.message;


        if (response.ok) {

            otpInput.style.display = "block";
            verifyOtpButton.style.display = "block";

            otpInput.focus();

        }

    } catch (error) {

        console.log(error);

        message.textContent =
            "Unable to send OTP.";

    }

});


// ===============================
// VERIFY OTP
// ===============================

verifyOtpButton.addEventListener("click", async () => {

    const mobile = mobileInput.value.trim();
    const otp = otpInput.value.trim();


    if (!/^[0-9]{6}$/.test(otp)) {

        message.textContent =
            "Please enter a valid 6-digit OTP.";

        return;
    }


    try {

        const response = await fetch("/api/verify-otp", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                mobile: mobile,
                otp: otp
            })

        });


        const data = await response.json();


        if (response.ok) {

            otpVerified = true;

            message.textContent =
                "OTP verified successfully!";

        } else {

            message.textContent =
                data.message;

        }

    } catch (error) {

        console.log(error);

        message.textContent =
            "OTP verification failed.";

    }

});


// ===============================
// REGISTRATION
// ===============================

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // OTP verification check

    if (!otpVerified) {

        message.textContent =
            "Please verify your mobile number with OTP first.";

        return;
    }


    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;


    // Password confirmation

    if (password !== confirmPassword) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    const userData = {

        name:
            document.getElementById("name").value,

        dateOfBirth:
            document.getElementById("dateOfBirth").value,

        gender:
            document.getElementById("gender").value,

        mobile:
            mobileInput.value.trim(),

        email:
            document.getElementById("email").value.trim() || undefined,

        username:
            document.getElementById("username").value,

        password:
            password

    };


    try {

        const response = await fetch("/api/register", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(userData)

        });


        const data = await response.json();


        if (response.ok) {

            message.textContent =
                "Registration successful!";

            registerForm.reset();

            otpVerified = false;

            otpInput.style.display = "none";

            verifyOtpButton.style.display = "none";

        } else {

            message.textContent =
                data.message;

        }

    } catch (error) {

        console.log(error);

        message.textContent =
            "Registration failed.";

    }

});