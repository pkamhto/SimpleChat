const currentUser =
    JSON.parse(
        localStorage.getItem("loggedInUser")
    );


if (!currentUser) {

    window.location.href =
        "/login.html";

    throw new Error(
        "User not logged in."
    );

}


/* =========================================
   URL DATA
========================================= */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const receiverId =
    urlParams.get("userId");

const receiverName =
    urlParams.get("userName");


if (!receiverId) {

    alert(
        "Chat user not found."
    );

    window.location.href =
        "/users.html";

    throw new Error(
        "Receiver ID missing."
    );

}


/* =========================================
   ELEMENTS
========================================= */

const messagesDiv =
    document.getElementById(
        "messages"
    );


const chatForm =
    document.getElementById(
        "chatForm"
    );


const messageInput =
    document.getElementById(
        "messageInput"
    );


const chatUserName =
    document.getElementById(
        "chatUserName"
    );


const chatUserStatus =
    document.getElementById(
        "chatUserStatus"
    );


const chatProfilePicture =
    document.getElementById(
        "chatProfilePicture"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================
   SETTINGS ELEMENTS
========================================= */

const chatSettingsButton =
    document.getElementById(
        "chatSettingsButton"
    );


const chatSettingsPanel =
    document.getElementById(
        "chatSettingsPanel"
    );


const closeSettingsButton =
    document.getElementById(
        "closeSettingsButton"
    );


const settingsOverlay =
    document.getElementById(
        "settingsOverlay"
    );


const wallpaperInput =
    document.getElementById(
        "wallpaperInput"
    );


const wallpaperButton =
    document.getElementById(
        "wallpaperButton"
    );


const resetSettingsButton =
    document.getElementById(
        "resetSettingsButton"
    );


const sentColorPicker =
    document.getElementById(
        "sentColorPicker"
    );


const receivedColorPicker =
    document.getElementById(
        "receivedColorPicker"
    );


const accentColorPicker =
    document.getElementById(
        "accentColorPicker"
    );


const saveColorsButton =
    document.getElementById(
        "saveColorsButton"
    );


const resetColorsButton =
    document.getElementById(
        "resetColorsButton"
    );


const settingsOptions =
    document.querySelectorAll(
        ".settings-option"
    );


/* =========================================
   DEFAULT PROFILE IMAGE
========================================= */

const defaultProfilePicture =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 200 200"
        >
            <rect
                width="200"
                height="200"
                fill="#dddddd"
            />

            <circle
                cx="100"
                cy="75"
                r="38"
                fill="#999999"
            />

            <path
                d="M35 180
                   C35 130 65 110 100 110
                   C135 110 165 130 165 180"
                fill="#999999"
            />
        </svg>
    `);


/* =========================================
   PROFILE
========================================= */

async function loadReceiverProfile() {

    try {

        const response =
            await fetch(
                "/api/users"
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load users."
            );

        }


        const users =
            await response.json();


        const receiver =
            users.find(
                user =>
                    String(
                        user._id ||
                        user.id
                    ) ===
                    String(
                        receiverId
                    )
            );


        if (!receiver) {

            chatUserName.textContent =
                receiverName ||
                "Private Chat";

            chatUserStatus.textContent =
                "User unavailable";

            chatProfilePicture.src =
                defaultProfilePicture;

            return;

        }


        chatUserName.textContent =
            receiver.name ||
            receiver.username ||
            receiverName ||
            "Private Chat";


        chatProfilePicture.src =
            receiver.profilePicture ||
            defaultProfilePicture;


        updateUserStatus(
            receiver
        );


    } catch (error) {

        console.log(
            "Receiver profile error:",
            error
        );


        chatUserName.textContent =
            receiverName ||
            "Private Chat";


        chatUserStatus.textContent =
            "Unable to load status";


        chatProfilePicture.src =
            defaultProfilePicture;

    }

}


/* =========================================
   ONLINE / OFFLINE STATUS
========================================= */

function formatLastSeen(
    lastSeen
) {

    if (!lastSeen) {

        return "Offline";

    }


    const date =
        new Date(lastSeen);


    const now =
        new Date();


    const difference =
        now - date;


    if (difference < 60000) {

        return "Last seen just now";

    }


    if (difference < 3600000) {

        const minutes =
            Math.floor(
                difference / 60000
            );


        return `Last seen ${minutes} minute${
            minutes === 1
                ? ""
                : "s"
        } ago`;

    }


    if (
        date.toDateString() ===
        now.toDateString()
    ) {

        return (
            "Last seen today at " +
            date.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        );

    }


    return (
        "Last seen " +
        date.toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        )
    );

}


function updateUserStatus(
    user
) {

    if (user.isOnline) {

        chatUserStatus.textContent =
            "Online";

        chatUserStatus.style.color =
            "#b9f6ca";

    } else {

        chatUserStatus.textContent =
            formatLastSeen(
                user.lastSeen
            );

        chatUserStatus.style.color =
            "";

    }

}


/* =========================================
   SOCKET.IO
========================================= */

const socket =
    io();


socket.on(
    "connect",
    () => {

        console.log(
            "Socket connected:",
            socket.id
        );


        socket.emit(
            "join private chat",
            {
                userId:
                    currentUser.id
            }
        );

    }
);


socket.on(
    "disconnect",
    () => {

        console.log(
            "Socket disconnected"
        );

    }
);


/* =========================================
   MESSAGE TIME
========================================= */

function formatMessageTime(
    dateValue
) {

    const date =
        new Date(dateValue);


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================
   SCROLL
========================================= */

function scrollToBottom() {

    messagesDiv.scrollTop =
        messagesDiv.scrollHeight;

}


/* =========================================
   HTML SECURITY
========================================= */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


/* =========================================
   DISPLAY MESSAGE
========================================= */

function displayMessage(
    messageData
) {

    const senderId =
        String(
            messageData.senderId ||
            messageData.sender
        );


    const isSent =
        senderId ===
        String(
            currentUser.id
        );


    const messageDiv =
        document.createElement(
            "div"
        );


    messageDiv.className =
        isSent
            ? "message sent"
            : "message received";


    /* =========================================
       APPLY CUSTOM MESSAGE COLOR
    ========================================= */

    if (isSent) {

        messageDiv.style.setProperty(
            "background-color",
            chatSettings.customSentColor ||
            "#d9fdd3",
            "important"
        );

    } else {

        messageDiv.style.setProperty(
            "background-color",
            chatSettings.customReceivedColor ||
            "#ffffff",
            "important"
        );

    }


    const messageText =
        document.createElement(
            "div"
        );


    messageText.className =
        "message-text";


    messageText.innerHTML =
        escapeHTML(
            messageData.message ||
            ""
        );


    const messageTime =
        document.createElement(
            "div"
        );


    messageTime.className =
        "message-time";


    messageTime.textContent =
        formatMessageTime(
            messageData.createdAt ||
            new Date()
        );


    messageDiv.appendChild(
        messageText
    );


    messageDiv.appendChild(
        messageTime
    );


    messagesDiv.appendChild(
        messageDiv
    );


    scrollToBottom();

}


/* =========================================
   LOAD MESSAGE HISTORY
========================================= */

async function loadMessages() {

    try {

        messagesDiv.innerHTML = `
            <div class="loading-message">
                Loading messages...
            </div>
        `;


        const response =
            await fetch(
                `/api/messages/${currentUser.id}/${receiverId}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load messages."
            );

        }


        const messages =
            await response.json();


        messagesDiv.innerHTML =
            "";


        if (
            !messages ||
            messages.length === 0
        ) {

            messagesDiv.innerHTML = `
                <div class="loading-message">
                    No messages yet. Start chatting!
                </div>
            `;

            return;

        }


        messages.forEach(
            message => {

                displayMessage(
                    message
                );

            }
        );


        scrollToBottom();


    } catch (error) {

        console.log(
            "Message history error:",
            error
        );


        messagesDiv.innerHTML = `
            <div class="loading-message">
                Unable to load messages.
            </div>
        `;

    }

}


/* =========================================
   MARK MESSAGES AS READ
========================================= */

async function markMessagesAsRead() {

    try {

        await fetch(
            "/api/messages/mark-read",
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    senderId:
                        receiverId,

                    receiverId:
                        currentUser.id

                })

            }
        );


    } catch (error) {

        console.log(
            "Mark read error:",
            error
        );

    }

}

/* =========================================
   RECEIVE MESSAGE
========================================= */

socket.on(
    "private message",
    messageData => {

        const senderId =
            String(
                messageData.senderId ||
                messageData.sender
            );


        const receiver =
            String(
                messageData.receiverId ||
                messageData.receiver
            );


        const isCurrentChat =
            (
                senderId ===
                String(receiverId)
            ) &&
            (
                receiver ===
                String(currentUser.id)
            );


        const isOwnMessage =
            (
                senderId ===
                String(currentUser.id)
            ) &&
            (
                receiver ===
                String(receiverId)
            );


        if (
            isCurrentChat ||
            isOwnMessage
        ) {

            displayMessage(
                messageData
            );


            if (isCurrentChat) {

                markMessagesAsRead();

            }

        }

    }
);


/* =========================================
   CHAT ERROR
========================================= */

socket.on(
    "chat error",
    data => {

        alert(
            data.message ||
            "Unable to send message."
        );

    }
);


/* =========================================
   SEND MESSAGE
========================================= */

chatForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const message =
            messageInput.value.trim();


        if (!message) {

            return;

        }


        socket.emit(
            "private message",
            {

                senderId:
                    currentUser.id,

                receiverId:
                    receiverId,

                message:
                    message

            }
        );


        messageInput.value =
            "";

        messageInput.focus();

    }
);


/* =========================================
   BACK BUTTON
========================================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "/users.html";

    }
);


/* =====================================================
   CHAT CUSTOMIZATION SYSTEM
===================================================== */


/* =========================================
   DEFAULT SETTINGS
========================================= */

const defaultSettings = {

    theme:
        "green",

    appearance:
        "light",

    fontSize:
        "medium",

    bubble:
        "rounded",

    density:
        "comfortable",

    wallpaper:
        "",

    customSentColor:
        "#d9fdd3",

    customReceivedColor:
        "#ffffff",

    customAccentColor:
        ""

};


/* =========================================
   SETTINGS STORAGE KEY
========================================= */

const settingsStorageKey =
    `simpleChatSettings_${currentUser.id}`;


/* =========================================
   GET SETTINGS
========================================= */

function getSettings() {

    try {

        const savedSettings =
            localStorage.getItem(
                settingsStorageKey
            );


        if (!savedSettings) {

            return {
                ...defaultSettings
            };

        }


        return {

            ...defaultSettings,

            ...JSON.parse(
                savedSettings
            )

        };


    } catch (error) {

        console.log(
            "Settings load error:",
            error
        );


        return {
            ...defaultSettings
        };

    }

}


/* =========================================
   CURRENT SETTINGS
========================================= */

let chatSettings =
    getSettings();


/* =========================================
   SAVE SETTINGS
========================================= */

function saveSettings() {

    try {

        localStorage.setItem(
            settingsStorageKey,
            JSON.stringify(
                chatSettings
            )
        );


    } catch (error) {

        console.log(
            "Settings save error:",
            error
        );

    }

}


/* =========================================
   THEME COLORS
========================================= */

const themeColors = {

    green: {

        header:
            "#075e54",

        sent:
            "#d9fdd3",

        accent:
            "#075e54"

    },


    blue: {

        header:
            "#1565c0",

        sent:
            "#dbeafe",

        accent:
            "#1565c0"

    },


    purple: {

        header:
            "#6a1b9a",

        sent:
            "#f0dcff",

        accent:
            "#6a1b9a"

    },


    orange: {

        header:
            "#e65100",

        sent:
            "#ffe0b2",

        accent:
            "#e65100"

    },


    pink: {

        header:
            "#c2185b",

        sent:
            "#fce4ec",

        accent:
            "#c2185b"

    },


    dark: {

        header:
            "#202c33",

        sent:
            "#005c4b",

        accent:
            "#00a884"

    }

};


/* =========================================
   APPLY SETTINGS
========================================= */

function applyChatSettings() {

    const container =
        document.querySelector(
            ".chat-container"
        );


    if (!container) {

        return;

    }


    const theme =
        themeColors[
            chatSettings.theme
        ] ||
        themeColors.green;


    /* =========================================
       THEME COLORS
    ========================================= */

    document.documentElement.style.setProperty(
        "--chat-header-color",
        theme.header
    );


    document.documentElement.style.setProperty(
        "--chat-accent-color",
        theme.accent
    );


    document.documentElement.style.setProperty(
        "--sent-message-color",
        theme.sent
    );


    document.documentElement.style.setProperty(
        "--received-message-color",
        "#ffffff"
    );


    /* =========================================
       CUSTOM MESSAGE COLORS
    ========================================= */

    document.documentElement.style.setProperty(
        "--custom-sent-color",
        chatSettings.customSentColor ||
        theme.sent
    );


    document.documentElement.style.setProperty(
        "--custom-received-color",
        chatSettings.customReceivedColor ||
        "#ffffff"
    );


    /* =========================================
       CUSTOM ACCENT COLOR
    ========================================= */

    document.documentElement.style.setProperty(
        "--custom-accent-color",
        chatSettings.customAccentColor ||
        theme.accent
    );


    /* =========================================
       CHAT TEXT COLORS
    ========================================= */

    let textColor =
        "#222222";


    let inputBackground =
        "#ffffff";


    let inputTextColor =
        "#222222";


    let messageTimeColor =
        "#667781";


    if (
        chatSettings.appearance ===
        "dark"
    ) {

        textColor =
            "#f1f1f1";


        inputBackground =
            "#2a2a2a";


        inputTextColor =
            "#ffffff";


        messageTimeColor =
            "#b8b8b8";

    }


    document.documentElement.style.setProperty(
        "--chat-text-color",
        textColor
    );


    document.documentElement.style.setProperty(
        "--input-background",
        inputBackground
    );


    document.documentElement.style.setProperty(
        "--input-text-color",
        inputTextColor
    );


    document.documentElement.style.setProperty(
        "--message-time-color",
        messageTimeColor
    );


    /* =========================================
       FONT SIZE
    ========================================= */

    let fontSize =
        "15px";


    if (
        chatSettings.fontSize ===
        "small"
    ) {

        fontSize =
            "13px";

    }


    if (
        chatSettings.fontSize ===
        "large"
    ) {

        fontSize =
            "18px";

    }


    document.documentElement.style.setProperty(
        "--message-font-size",
        fontSize
    );


    /* =========================================
       MESSAGE STYLE
    ========================================= */

    let radius =
        "12px";


    if (
        chatSettings.bubble ===
        "compact"
    ) {

        radius =
            "8px";

    }


    if (
        chatSettings.bubble ===
        "square"
    ) {

        radius =
            "2px";

    }


    document.documentElement.style.setProperty(
        "--message-radius",
        radius
    );


    /* =========================================
       CHAT DENSITY
    ========================================= */

    let padding =
        "8px 12px";


    let margin =
        "7px";


    if (
        chatSettings.density ===
        "compact"
    ) {

        padding =
            "5px 9px";


        margin =
            "3px";

    }


    if (
        chatSettings.density ===
        "spacious"
    ) {

        padding =
            "12px 16px";


        margin =
            "12px";

    }


    document.documentElement.style.setProperty(
        "--message-padding",
        padding
    );


    document.documentElement.style.setProperty(
        "--message-margin",
        margin
    );


    /* =========================================
       CHAT BACKGROUND / WALLPAPER
    ========================================= */

    if (
        chatSettings.wallpaper
    ) {

        document.documentElement.style.setProperty(
            "--chat-background",
            `url("${chatSettings.wallpaper}")`
        );


        container.style.backgroundImage =
            `url("${chatSettings.wallpaper}")`;


        container.style.backgroundSize =
            "cover";


        container.style.backgroundPosition =
            "center";


    } else {

        document.documentElement.style.setProperty(
            "--chat-background",
            "#e5ddd5"
        );


        container.style.backgroundImage =
            "none";

    }


    /* =========================================
       ACTIVE SETTINGS
    ========================================= */

    document
        .querySelectorAll(
            ".settings-option"
        )
        .forEach(
            option => {

                option.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-value="${chatSettings.theme}"]`
        )
        .forEach(
            option => {

                option.classList.add(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-value="${chatSettings.appearance}"]`
        )
        .forEach(
            option => {

                option.classList.add(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-value="${chatSettings.fontSize}"]`
        )
        .forEach(
            option => {

                option.classList.add(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-value="${chatSettings.bubble}"]`
        )
        .forEach(
            option => {

                option.classList.add(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            `[data-value="${chatSettings.density}"]`
        )
        .forEach(
            option => {

                option.classList.add(
                    "active"
                );

            }
        );


    /* =========================================
       UPDATE EXISTING MESSAGE COLORS
    ========================================= */

    document
        .querySelectorAll(
            ".message.sent"
        )
        .forEach(
            message => {

                message.style.setProperty(
                    "background-color",
                    chatSettings.customSentColor ||
                    theme.sent,
                    "important"
                );

            }
        );


    document
        .querySelectorAll(
            ".message.received"
        )
        .forEach(
            message => {

                message.style.setProperty(
                    "background-color",
                    chatSettings.customReceivedColor ||
                    "#ffffff",
                    "important"
                );

            }
        );


    /* =========================================
       UPDATE HEADER
    ========================================= */

    const chatHeader =
        document.querySelector(
            ".chat-header"
        );


    if (chatHeader) {

        chatHeader.style.setProperty(
            "background-color",
            chatSettings.customAccentColor ||
            theme.header,
            "important"
        );

    }


    /* =========================================
       UPDATE SEND BUTTON
    ========================================= */

    const sendButton =
        document.getElementById(
            "sendButton"
        );


    if (sendButton) {

        sendButton.style.setProperty(
            "background-color",
            chatSettings.customAccentColor ||
            theme.accent,
            "important"
        );

    }

}

/* =========================================
   OPEN SETTINGS
========================================= */

function openSettings() {

    chatSettingsPanel.classList.add(
        "open"
    );


    settingsOverlay.classList.add(
        "show"
    );

}


/* =========================================
   CLOSE SETTINGS
========================================= */

function closeSettings() {

    chatSettingsPanel.classList.remove(
        "open"
    );


    settingsOverlay.classList.remove(
        "show"
    );

}


/* =========================================
   SETTINGS BUTTON
========================================= */

chatSettingsButton.addEventListener(
    "click",
    openSettings
);


/* =========================================
   CLOSE BUTTON
========================================= */

closeSettingsButton.addEventListener(
    "click",
    closeSettings
);


/* =========================================
   OVERLAY CLICK
========================================= */

settingsOverlay.addEventListener(
    "click",
    closeSettings
);


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeSettings();

        }

    }
);


/* =========================================
   SETTINGS OPTIONS
========================================= */

settingsOptions.forEach(
    option => {

        option.addEventListener(
            "click",
            () => {

                const setting =
                    option.dataset.setting;


                const value =
                    option.dataset.value;


                if (
                    !setting ||
                    !value
                ) {

                    return;

                }


                if (
                    setting ===
                    "theme"
                ) {

                    chatSettings.theme =
                        value;

                }


                if (
                    setting ===
                    "appearance"
                ) {

                    chatSettings.appearance =
                        value;

                }


                if (
                    setting ===
                    "fontSize"
                ) {

                    chatSettings.fontSize =
                        value;

                }


                if (
                    setting ===
                    "bubble"
                ) {

                    chatSettings.bubble =
                        value;

                }


                if (
                    setting ===
                    "density"
                ) {

                    chatSettings.density =
                        value;

                }


                saveSettings();

                applyChatSettings();

            }
        );

    }
);


/* =========================================
   WALLPAPER BUTTON
========================================= */

wallpaperButton.addEventListener(
    "click",
    () => {

        wallpaperInput.click();

    }
);


/* =========================================
   COMPRESS WALLPAPER
========================================= */

function compressWallpaper(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            const maxWidth =
                                900;


                            const scale =
                                Math.min(
                                    1,
                                    maxWidth /
                                    image.width
                                );


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                Math.round(
                                    image.width *
                                    scale
                                );


                            canvas.height =
                                Math.round(
                                    image.height *
                                    scale
                                );


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.drawImage(
                                image,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );


                            const compressed =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.55
                                );


                            resolve(
                                compressed
                            );

                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Unable to read image."
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to read wallpaper."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================
   WALLPAPER CHANGE
========================================= */

wallpaperInput.addEventListener(
    "change",
    async () => {

        const file =
            wallpaperInput.files[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please select an image file."
            );


            wallpaperInput.value =
                "";


            return;

        }


        try {

            const wallpaper =
                await compressWallpaper(
                    file
                );


            if (
                wallpaper.length >
                4 * 1024 * 1024
            ) {

                alert(
                    "Wallpaper is too large. Please choose another image."
                );


                wallpaperInput.value =
                    "";


                return;

            }


            chatSettings.wallpaper =
                wallpaper;


            saveSettings();

            applyChatSettings();


        } catch (error) {

            console.log(
                "Wallpaper error:",
                error
            );


            alert(
                "Unable to set wallpaper."
            );

        }


        wallpaperInput.value =
            "";

    }
);


/* =========================================
   RESET SETTINGS
========================================= */

resetSettingsButton.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Reset all chat settings to default?"
            );


        if (!confirmed) {

            return;

        }


        chatSettings = {
            ...defaultSettings
        };


        saveSettings();

        applyChatSettings();

        loadColorPickerValues();

    }
);


/* =========================================
   LOAD SETTINGS
========================================= */

applyChatSettings();


/* =========================================
   INITIAL LOAD
========================================= */

chatProfilePicture.src =
    defaultProfilePicture;


if (receiverName) {

    chatUserName.textContent =
        receiverName;

}


/* =========================================
   COLOR PICKER SYSTEM
========================================= */

function loadColorPickerValues() {

    if (sentColorPicker) {

        sentColorPicker.value =
            chatSettings.customSentColor ||
            "#d9fdd3";

    }


    if (receivedColorPicker) {

        receivedColorPicker.value =
            chatSettings.customReceivedColor ||
            "#ffffff";

    }


    if (accentColorPicker) {

        const defaultAccent =
            themeColors[
                chatSettings.theme
            ]?.accent ||
            "#075e54";


        accentColorPicker.value =
            chatSettings.customAccentColor ||
            defaultAccent;

    }

}


/* =========================================
   SAVE COLOR SETTINGS
========================================= */

function saveColorSettings() {

    saveSettings();

    applyChatSettings();

}


/* =========================================
   MY MESSAGE COLOR
========================================= */

if (sentColorPicker) {

    sentColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customSentColor =
                sentColorPicker.value;


            saveColorSettings();

        }
    );

}


/* =========================================
   RECEIVED MESSAGE COLOR
========================================= */

if (receivedColorPicker) {

    receivedColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customReceivedColor =
                receivedColorPicker.value;


            saveColorSettings();

        }
    );

}


/* =========================================
   ACCENT COLOR
========================================= */

if (accentColorPicker) {

    accentColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customAccentColor =
                accentColorPicker.value;


            saveColorSettings();

        }
    );

}


/* =========================================
   SAVE BUTTON
========================================= */

if (saveColorsButton) {

    saveColorsButton.addEventListener(
        "click",
        () => {

            saveColorSettings();


            alert(
                "🎨 Colors saved successfully!"
            );

        }
    );

}


/* =========================================
   RESET COLORS
========================================= */

if (resetColorsButton) {

    resetColorsButton.addEventListener(
        "click",
        () => {

            chatSettings.customSentColor =
                "#d9fdd3";


            chatSettings.customReceivedColor =
                "#ffffff";


            chatSettings.customAccentColor =
                "";


            loadColorPickerValues();

            saveColorSettings();


            alert(
                "🎨 Colors reset successfully!"
            );

        }
    );

}


/* =========================================
   LOAD SAVED COLORS
========================================= */

loadColorPickerValues();


/* =========================================
   LOAD RECEIVER PROFILE
========================================= */

loadReceiverProfile();


/* =========================================
   LOAD CHAT HISTORY
========================================= */

loadMessages();


/* =========================================
   MARK MESSAGES AS READ
========================================= */

markMessagesAsRead();

/* =========================================
   SETTINGS OPTION HANDLER
========================================= */

settingsOptions.forEach(
    option => {

        option.addEventListener(
            "click",
            () => {

                const setting =
                    option.dataset.setting;

                const value =
                    option.dataset.value;

                if (
                    !setting ||
                    !value
                ) {
                    return;
                }

                chatSettings[setting] =
                    value;

                saveSettings();

                applyChatSettings();

            }
        );

    }
);


/* =========================================
   WALLPAPER BUTTON
========================================= */

wallpaperButton.addEventListener(
    "click",
    () => {

        wallpaperInput.click();

    }
);


/* =========================================
   COMPRESS WALLPAPER
========================================= */

function compressWallpaper(
    file
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();

            reader.onload =
                event => {

                    const image =
                        new Image();

                    image.onload =
                        () => {

                            const maxWidth =
                                900;

                            const scale =
                                Math.min(
                                    1,
                                    maxWidth /
                                    image.width
                                );

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                Math.round(
                                    image.width *
                                    scale
                                );

                            canvas.height =
                                Math.round(
                                    image.height *
                                    scale
                                );

                            const context =
                                canvas.getContext(
                                    "2d"
                                );

                            context.drawImage(
                                image,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );

                            const compressed =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.55
                                );

                            resolve(
                                compressed
                            );

                        };

                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Unable to read image."
                                )
                            );

                        };

                    image.src =
                        event.target.result;

                };

            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to read wallpaper."
                        )
                    );

                };

            reader.readAsDataURL(
                file
            );

        }
    );

}


/* =========================================
   WALLPAPER CHANGE
========================================= */

wallpaperInput.addEventListener(
    "change",
    async () => {

        const file =
            wallpaperInput.files[0];

        if (!file) {

            return;

        }

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please select an image file."
            );

            wallpaperInput.value =
                "";

            return;

        }

        try {

            const wallpaper =
                await compressWallpaper(
                    file
                );

            if (
                wallpaper.length >
                4 * 1024 * 1024
            ) {

                alert(
                    "Wallpaper is too large. Please choose another image."
                );

                wallpaperInput.value =
                    "";

                return;

            }

            chatSettings.wallpaper =
                wallpaper;

            saveSettings();

            applyChatSettings();

        } catch (error) {

            console.log(
                "Wallpaper error:",
                error
            );

            alert(
                "Unable to set wallpaper."
            );

        }

        wallpaperInput.value =
            "";

    }
);


/* =========================================
   RESET SETTINGS
========================================= */

resetSettingsButton.addEventListener(
    "click",
    () => {

        const confirmed =
            confirm(
                "Reset all chat settings to default?"
            );

        if (!confirmed) {

            return;

        }

        chatSettings = {
            ...defaultSettings
        };

        saveSettings();

        applyChatSettings();

    }
);


/* =========================================
   LOAD SETTINGS
========================================= */

applyChatSettings();


/* =========================================
   INITIAL LOAD
========================================= */

chatProfilePicture.src =
    defaultProfilePicture;


if (receiverName) {

    chatUserName.textContent =
        receiverName;

}


/* =========================================
   COLOR PICKER SYSTEM
========================================= */

function loadColorPickerValues() {

    if (sentColorPicker) {

        sentColorPicker.value =
            chatSettings.customSentColor ||
            "#d9fdd3";

    }

    if (receivedColorPicker) {

        receivedColorPicker.value =
            chatSettings.customReceivedColor ||
            "#ffffff";

    }

    if (accentColorPicker) {

        const defaultAccent =
            themeColors[
                chatSettings.theme
            ]?.accent ||
            "#075e54";

        accentColorPicker.value =
            chatSettings.customAccentColor ||
            defaultAccent;

    }

}


/* =========================================
   SAVE COLOR SETTINGS
========================================= */

function saveColorSettings() {

    saveSettings();

    applyChatSettings();

}


/* =========================================
   MY MESSAGE COLOR
========================================= */

if (sentColorPicker) {

    sentColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customSentColor =
                sentColorPicker.value;

            saveColorSettings();

        }
    );

}


/* =========================================
   RECEIVED MESSAGE COLOR
========================================= */

if (receivedColorPicker) {

    receivedColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customReceivedColor =
                receivedColorPicker.value;

            saveColorSettings();

        }
    );

}


/* =========================================
   ACCENT COLOR
========================================= */

if (accentColorPicker) {

    accentColorPicker.addEventListener(
        "input",
        () => {

            chatSettings.customAccentColor =
                accentColorPicker.value;

            saveColorSettings();

        }
    );

}


/* =========================================
   SAVE BUTTON
========================================= */

if (saveColorsButton) {

    saveColorsButton.addEventListener(
        "click",
        () => {

            saveColorSettings();

            alert(
                "🎨 Colors saved successfully!"
            );

        }
    );

}

/* =========================================
   RESET COLORS
========================================= */

if (resetColorsButton) {

    resetColorsButton.addEventListener(
        "click",
        () => {

            chatSettings.customSentColor =
                "#d9fdd3";


            chatSettings.customReceivedColor =
                "#ffffff";


            chatSettings.customAccentColor =
                "";


            loadColorPickerValues();


            saveColorSettings();


            alert(
                "🎨 Colors reset successfully!"
            );

        }
    );

}


/* =========================================
   LOAD SAVED COLORS
========================================= */

loadColorPickerValues();


/* =========================================
   LOAD RECEIVER PROFILE
========================================= */

loadReceiverProfile();


/* =========================================
   LOAD CHAT HISTORY
========================================= */

loadMessages();


/* =========================================
   MARK MESSAGES AS READ
========================================= */

markMessagesAsRead();

