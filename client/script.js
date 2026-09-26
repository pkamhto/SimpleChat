const socket = io();

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatBox = document.getElementById("chatBox");

// Send button पर click
sendButton.addEventListener("click", () => {

    const message = messageInput.value.trim();

    // अगर message खाली है तो कुछ मत करो
    if (message === "") {
        return;
    }

    // Server को message भेजना
    socket.emit("chat message", message);

    // Input खाली करना
    messageInput.value = "";

    // वापस input box में cursor रखना
    messageInput.focus();
});


// Server से message receive करना
socket.on("chat message", (data) => {

    const messageElement = document.createElement("div");

    // अपना message
    if (data.senderId === socket.id) {

        messageElement.classList.add("message", "my-message");

    } else {

        // दूसरे user का message
        messageElement.classList.add("message", "other-message");

    }

    messageElement.textContent = data.message;

    chatBox.appendChild(messageElement);

    // नया message आने पर नीचे scroll
    chatBox.scrollTop = chatBox.scrollHeight;

});