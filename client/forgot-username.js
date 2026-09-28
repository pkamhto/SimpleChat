const mobileInput = document.getElementById("mobile");
const otpInput = document.getElementById("otp");

const sendOtpButton = document.getElementById("sendOtpButton");
const verifyOtpButton = document.getElementById("verifyOtpButton");

const message = document.getElementById("message");
const usernameResult = document.getElementById("usernameResult");


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

        console.error("Send OTP error:", error);

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

        // STEP 1: Verify OTP

        const otpResponse = await fetch(
            "/api/verify-otp",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mobile: mobile,
                    otp: otp
                })
            }
        );


        const otpData = await otpResponse.json();


        if (!otpResponse.ok) {

            message.textContent =
                otpData.message;

            return;
        }


        message.textContent =
            "OTP verified successfully!";


        // STEP 2: Get username

        const usernameResponse = await fetch(
            "/api/forgot-username",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    mobile: mobile
                })
            }
        );


        const usernameData =
            await usernameResponse.json();


        if (!usernameResponse.ok) {

            usernameResult.textContent =
                usernameData.message;

            return;
        }


        // STEP 3: Show username

        usernameResult.textContent =
            "Your username is: " +
            usernameData.username;


    } catch (error) {

        console.error(
            "Forgot username error:",
            error
        );

        message.textContent =
            "Something went wrong. Check browser console.";

    }

});