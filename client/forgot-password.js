const loginIdInput = document.getElementById("loginId");

const otpInput = document.getElementById("otp");

const sendOtpButton =
    document.getElementById("sendOtpButton");

const verifyOtpButton =
    document.getElementById("verifyOtpButton");

const passwordSection =
    document.getElementById("passwordSection");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const message =
    document.getElementById("message");


// =====================================
// SEND OTP
// =====================================

sendOtpButton.addEventListener("click", async () => {

    const loginId =
        loginIdInput.value.trim();


    if (!loginId) {

        message.textContent =
            "Please enter username, email or mobile.";

        return;
    }


    try {

        const response = await fetch(
            "/api/forgot-password/send-otp",
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    loginId: loginId
                })

            }
        );


        const data =
            await response.json();


        message.textContent =
            data.message;


        if (response.ok) {

            otpInput.style.display = "block";

            verifyOtpButton.style.display =
                "block";

            otpInput.focus();

        }


    } catch (error) {

        console.error(
            "Send OTP error:",
            error
        );

        message.textContent =
            "Unable to send OTP.";

    }

});


// =====================================
// VERIFY OTP
// =====================================

verifyOtpButton.addEventListener(
    "click",
    async () => {

        const loginId =
            loginIdInput.value.trim();

        const otp =
            otpInput.value.trim();


        if (!/^[0-9]{6}$/.test(otp)) {

            message.textContent =
                "Please enter a valid 6-digit OTP.";

            return;
        }


        try {

            const response = await fetch(
                "/api/forgot-password/verify-otp",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        loginId: loginId,
                        otp: otp
                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.message;

                return;
            }


            message.textContent =
                "OTP verified successfully!";


            passwordSection.style.display =
                "block";


            loginIdInput.disabled = true;

            otpInput.disabled = true;

            sendOtpButton.disabled = true;

            verifyOtpButton.disabled = true;


        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );

            message.textContent =
                "OTP verification failed.";

        }

    }
);


// =====================================
// RESET PASSWORD
// =====================================

resetPasswordButton.addEventListener(
    "click",
    async () => {

        const loginId =
            loginIdInput.value.trim();

        const password =
            newPassword.value;

        const confirm =
            confirmPassword.value;


        if (!password || !confirm) {

            message.textContent =
                "Please enter both passwords.";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        if (password !== confirm) {

            message.textContent =
                "Passwords do not match.";

            return;
        }


        try {

            const response = await fetch(
                "/api/forgot-password/reset",
                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        loginId: loginId,
                        password: password
                    })

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.message;

                return;
            }


            message.textContent =
                "Password reset successful!";


            passwordSection.style.display =
                "none";


            otpInput.style.display =
                "none";


            verifyOtpButton.style.display =
                "none";


            setTimeout(() => {

                window.location.href =
                    "/login.html";

            }, 1500);


        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            message.textContent =
                "Password reset failed.";

        }

    }
);