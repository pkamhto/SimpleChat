    const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                loginId,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {

    loginMessage.textContent =
        "Login successful!";

    localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
    );

    window.location.href =
        "/users.html";

} else {

    loginMessage.textContent =
        data.message;
}

    } catch (error) {
        console.log(error);
        loginMessage.textContent = "Login failed.";
    }
});