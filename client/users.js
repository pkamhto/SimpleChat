// =====================================
// CURRENT USER
// =====================================

const currentUser =
    JSON.parse(
        localStorage.getItem("loggedInUser")
    );

if (!currentUser) {

    window.location.href =
        "/login.html";

}


// =====================================
// ELEMENTS
// =====================================

const currentUserDiv =
    document.getElementById(
        "currentUser"
    );

const usersList =
    document.getElementById(
        "usersList"
    );

const friendRequestsDiv =
    document.getElementById(
        "friendRequests"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================
// DEFAULT PROFILE IMAGE
// =====================================

const defaultProfileImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 100 100"
        >

            <rect
                width="100"
                height="100"
                fill="#dddddd"
            />

            <circle
                cx="50"
                cy="37"
                r="20"
                fill="#999999"
            />

            <path
                d="
                    M15 90
                    C15 65
                    85 65
                    85 90
                    Z
                "
                fill="#999999"
            />

        </svg>
    `);


// =====================================
// UNREAD COUNT BY SENDER
// =====================================

let unreadCountsBySender = {};


// =====================================
// DISPLAY CURRENT USER
// =====================================

currentUserDiv.innerHTML = `

    <div
        style="
            display:flex;
            align-items:center;
            gap:12px;
            margin-bottom:15px;
        "
    >

        <img
            src="${
                currentUser.profilePicture ||
                defaultProfileImage
            }"
            style="
                width:55px;
                height:55px;
                border-radius:50%;
                object-fit:cover;
                border:2px solid #075e54;
            "
        >

        <div>

            <strong>
                Logged in as:
            </strong>

            ${currentUser.name}

            <br>

            <small>
                @${currentUser.username}
            </small>

        </div>

    </div>

`;


// =====================================
// LOAD UNREAD COUNTS
// =====================================

async function loadUnreadCountsBySender() {

    try {

        const response =
            await fetch(
                `/api/unread-messages/by-sender/${currentUser.id}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load unread counts."
            );

        }


        const data =
            await response.json();


        unreadCountsBySender = {};


        data.forEach(
            item => {

                unreadCountsBySender[
                    String(item._id)
                ] =
                    item.unreadCount;

            }
        );


    } catch (error) {

        console.error(
            "Unread count error:",
            error
        );


        unreadCountsBySender = {};

    }

}


// =====================================
// FORMAT LAST SEEN
// =====================================

function formatLastSeen(lastSeen) {

    if (!lastSeen) {

        return "Last seen unavailable";

    }


    const lastSeenDate =
        new Date(lastSeen);


    const now =
        new Date();


    const difference =
        now - lastSeenDate;


    const seconds =
        Math.floor(
            difference / 1000
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const hours =
        Math.floor(
            minutes / 60
        );


    const days =
        Math.floor(
            hours / 24
        );


    if (seconds < 60) {

        return "Last seen just now";

    }


    if (minutes < 60) {

        return `Last seen ${minutes} minute${
            minutes === 1
                ? ""
                : "s"
        } ago`;

    }


    if (hours < 24) {

        return `Last seen ${hours} hour${
            hours === 1
                ? ""
                : "s"
        } ago`;

    }


    if (days < 7) {

        return `Last seen ${days} day${
            days === 1
                ? ""
                : "s"
        } ago`;

    }


    return (
        "Last seen " +
        lastSeenDate.toLocaleString()
    );

}


// =====================================
// LOAD USERS
// =====================================

async function loadUsers() {

    try {

        await loadUnreadCountsBySender();


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


        usersList.innerHTML =
            "";


        // Remove current user

        const otherUsers =
            users.filter(
                user =>
                    String(
                        user._id ||
                        user.id
                    ) !==
                    String(
                        currentUser.id
                    )
            );


        if (
            otherUsers.length === 0
        ) {

            usersList.innerHTML =
                "<p>No other users found.</p>";

            return;

        }


        // =====================================
        // EACH USER
        // =====================================

        otherUsers.forEach(
            user => {

                const userId =
                    String(
                        user._id ||
                        user.id
                    );


                const unreadCount =
                    unreadCountsBySender[
                        userId
                    ] || 0;


                // =================================
                // PROFILE PHOTO
                // =================================

                const userPhoto =
                    user.profilePicture ||
                    defaultProfileImage;


                // =================================
                // ONLINE / OFFLINE
                // =================================

                let statusHTML = "";


                if (
                    user.isOnline === true
                ) {

                    statusHTML = `

                        <div
                            style="
                                color:#128c7e;
                                font-size:13px;
                                margin-top:4px;
                            "
                        >
                            🟢 Online
                        </div>

                    `;

                } else {

                    statusHTML = `

                        <div
                            style="
                                color:#777;
                                font-size:13px;
                                margin-top:4px;
                            "
                        >

                            ⚫ ${
                                formatLastSeen(
                                    user.lastSeen
                                )
                            }

                        </div>

                    `;

                }


                // =================================
                // UNREAD COUNT
                // =================================

                const unreadHTML =
                    unreadCount > 0

                        ? `

                            <span
                                style="
                                    margin-left:8px;
                                    color:red;
                                    font-weight:bold;
                                    font-size:12px;
                                "
                            >
                                🔴 ${unreadCount} unread
                            </span>

                        `

                        : "";


                // =================================
                // USER DIV
                // =================================

                const userDiv =
                    document.createElement(
                        "div"
                    );


                userDiv.className =
                    "user-item";


                userDiv.style.cssText = `

                    display:flex;
                    align-items:center;
                    gap:12px;
                    padding:12px;
                    margin-bottom:10px;
                    background:#ffffff;
                    border-radius:10px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.12);

                `;


                userDiv.innerHTML = `

                    <!-- PROFILE PHOTO -->

                    <img
                        src="${userPhoto}"
                        alt="Profile Picture"
                        style="
                            width:55px;
                            height:55px;
                            min-width:55px;
                            border-radius:50%;
                            object-fit:cover;
                            border:2px solid #075e54;
                        "
                    >


                    <!-- USER INFORMATION -->

                    <div
                        style="
                            flex:1;
                            min-width:0;
                        "
                    >

                        <strong
                            style="
                                font-size:16px;
                            "
                        >
                            ${user.name}
                        </strong>


                        <br>


                        <small
                            style="
                                color:#666;
                            "
                        >
                            @${user.username}
                        </small>


                        ${statusHTML}


                        <div
                            style="
                                margin-top:7px;
                            "
                        >

                            <button
                                type="button"
                                class="chat-button"
                                data-user-id="${userId}"
                                data-user-name="${user.name}"
                                style="
                                    background:#075e54;
                                    color:white;
                                    border:none;
                                    border-radius:18px;
                                    padding:7px 14px;
                                    cursor:pointer;
                                "
                            >
                                💬 Chat
                            </button>


                            ${unreadHTML}

                        </div>

                    </div>

                `;


                // =================================
                // CHAT BUTTON
                // =================================

                const chatButton =
                    userDiv.querySelector(
                        ".chat-button"
                    );


                chatButton.addEventListener(
                    "click",
                    () => {

                        openChat(
                            userId,
                            user.name
                        );

                    }
                );


                usersList.appendChild(
                    userDiv
                );

            }
        );


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );


        usersList.innerHTML =
            "<p>Unable to load users.</p>";

    }

}


// =====================================
// OPEN CHAT
// =====================================

function openChat(
    userId,
    userName
) {

    window.location.href =
        `/chat.html?userId=${encodeURIComponent(
            userId
        )}&userName=${encodeURIComponent(
            userName
        )}`;

}


// =====================================
// SOCKET.IO
// =====================================

const notificationSocket =
    io();


notificationSocket.on(
    "connect",
    () => {

        console.log(
            "Notification socket connected:",
            notificationSocket.id
        );


        notificationSocket.emit(
            "join private chat",
            {
                userId:
                    currentUser.id
            }
        );

    }
);


// =====================================
// NEW MESSAGE NOTIFICATION
// =====================================

notificationSocket.on(
    "new message notification",
    data => {

        console.log(
            "New message notification:",
            data
        );


        const senderId =
            String(
                data.senderId
            );


        unreadCountsBySender[
            senderId
        ] =
            (
                unreadCountsBySender[
                    senderId
                ] || 0
            ) + 1;


        // Refresh users

        loadUsers();


        // Browser notification

        if (
            "Notification" in window &&
            Notification.permission ===
                "granted"
        ) {

            const notification =
                new Notification(
                    data.senderName
                        ? `Message from ${data.senderName}`
                        : "SimpleChat",
                    {
                        body:
                            data.message ||
                            "New message received."
                    }
                );


            notification.onclick =
                function () {

                    window.focus();


                    openChat(
                        data.senderId,
                        data.senderName ||
                            "User"
                    );

                };

        }

    }
);


// =====================================
// NOTIFICATION PERMISSION
// =====================================

if (
    "Notification" in window
) {

    if (
        Notification.permission ===
        "default"
    ) {

        Notification
            .requestPermission()
            .then(
                permission => {

                    console.log(
                        "Notification permission:",
                        permission
                    );

                }
            )
            .catch(
                error => {

                    console.error(
                        "Notification permission error:",
                        error
                    );

                }
            );

    }

}


// =====================================
// LOAD FRIEND REQUESTS
// =====================================

async function loadFriendRequests() {

    try {

        const response =
            await fetch(
                `/api/friends/requests/${currentUser.id}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load friend requests."
            );

        }


        const requests =
            await response.json();


        friendRequestsDiv.innerHTML =
            "";


        if (
            !requests ||
            requests.length === 0
        ) {

            friendRequestsDiv.innerHTML =
                "<p>No pending requests.</p>";

            return;

        }


        requests.forEach(
            request => {

                const sender =
                    request.sender;


                const senderPhoto =
                    sender.profilePicture ||
                    defaultProfileImage;


                const requestDiv =
                    document.createElement(
                        "div"
                    );


                requestDiv.className =
                    "friend-request";


                requestDiv.style.cssText = `

                    display:flex;
                    align-items:center;
                    gap:10px;
                    padding:10px;
                    margin-bottom:10px;
                    background:#ffffff;
                    border-radius:10px;

                `;


                requestDiv.innerHTML = `

                    <img
                        src="${senderPhoto}"
                        alt="Profile Picture"
                        style="
                            width:45px;
                            height:45px;
                            border-radius:50%;
                            object-fit:cover;
                        "
                    >


                    <div
                        style="
                            flex:1;
                        "
                    >

                        <strong>
                            ${sender.name}
                        </strong>

                        <br>

                        <small>
                            @${sender.username}
                        </small>

                    </div>


                    <button
                        type="button"
                        class="accept-request"
                        data-id="${request._id}"
                    >
                        Accept
                    </button>


                    <button
                        type="button"
                        class="reject-request"
                        data-id="${request._id}"
                    >
                        Reject
                    </button>

                `;


                const acceptButton =
                    requestDiv.querySelector(
                        ".accept-request"
                    );


                const rejectButton =
                    requestDiv.querySelector(
                        ".reject-request"
                    );


                acceptButton.addEventListener(
                    "click",
                    () => {

                        respondToFriendRequest(
                            request._id,
                            "accepted"
                        );

                    }
                );


                rejectButton.addEventListener(
                    "click",
                    () => {

                        respondToFriendRequest(
                            request._id,
                            "rejected"
                        );

                    }
                );


                friendRequestsDiv.appendChild(
                    requestDiv
                );

            }
        );


    } catch (error) {

        console.error(
            "Friend requests error:",
            error
        );


        friendRequestsDiv.innerHTML =
            "<p>Unable to load friend requests.</p>";

    }

}


// =====================================
// RESPOND TO FRIEND REQUEST
// =====================================

async function respondToFriendRequest(
    requestId,
    status
) {

    try {

        const endpoint =
            status === "accepted"
                ? `/api/friends/accept/${requestId}`
                : `/api/friends/reject/${requestId}`;


        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to update request."
            );

            return;

        }


        alert(
            status === "accepted"
                ? "Friend request accepted."
                : "Friend request rejected."
        );


        loadFriendRequests();

        loadUsers();


    } catch (error) {

        console.error(
            "Friend request response error:",
            error
        );


        alert(
            "Something went wrong."
        );

    }

}


// =====================================
// LOGOUT
// =====================================

logoutButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "loggedInUser"
        );


        window.location.href =
            "/login.html";

    }
);


// =====================================
// INITIAL LOAD
// =====================================

loadUsers();

loadFriendRequests();