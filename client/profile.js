// =====================================
// CURRENT USER
// =====================================

const currentUser =
    JSON.parse(
        localStorage.getItem("loggedInUser")
    );

if (!currentUser) {
    window.location.href = "/login.html";
}


// =====================================
// ELEMENTS
// =====================================

const profilePicture =
    document.getElementById("profilePicture");

const profilePictureInput =
    document.getElementById("profilePictureInput");

const changePhotoButton =
    document.getElementById("changePhotoButton");

const nameInput =
    document.getElementById("name");

const usernameInput =
    document.getElementById("username");

const dateOfBirthInput =
    document.getElementById("dateOfBirth");

const genderInput =
    document.getElementById("gender");

const mobileInput =
    document.getElementById("mobile");

const emailInput =
    document.getElementById("email");

const editMobileButton =
    document.getElementById("editMobileButton");

const changePasswordButton =
    document.getElementById("changePasswordButton");

const profileMessage =
    document.getElementById("profileMessage");

const backButton =
    document.getElementById("backButton");


// =====================================
// DEFAULT PROFILE IMAGE
// =====================================

const defaultProfileImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="150"
            height="150"
            viewBox="0 0 150 150"
        >

            <rect
                width="150"
                height="150"
                fill="#dddddd"
            />

            <circle
                cx="75"
                cy="55"
                r="30"
                fill="#999999"
            />

            <path
                d="
                    M25 135
                    C25 100
                    125 100
                    125 135
                    Z
                "
                fill="#999999"
            />

        </svg>
    `);


// =====================================
// SHOW MESSAGE
// =====================================

function showMessage(message) {

    profileMessage.textContent =
        message;

}


// =====================================
// LOAD PROFILE
// =====================================

function loadProfile() {

    nameInput.value =
        currentUser.name || "";

    usernameInput.value =
        currentUser.username || "";

    mobileInput.value =
        currentUser.mobile || "";

    emailInput.value =
        currentUser.email || "";

    genderInput.value =
        currentUser.gender || "";


    // DATE OF BIRTH

    if (currentUser.dateOfBirth) {

        const dob =
            new Date(
                currentUser.dateOfBirth
            );

        if (!isNaN(dob.getTime())) {

            const year =
                dob.getFullYear();

            const month =
                String(
                    dob.getMonth() + 1
                ).padStart(2, "0");

            const day =
                String(
                    dob.getDate()
                ).padStart(2, "0");

            dateOfBirthInput.value =
                `${year}-${month}-${day}`;
        }

    }


    // PROFILE PHOTO

    if (currentUser.profilePicture) {

        profilePicture.src =
            currentUser.profilePicture;

    } else {

        profilePicture.src =
            defaultProfileImage;

    }

}


// =====================================
// FIELD EDIT SYSTEM
// =====================================

const editButtons =
    document.querySelectorAll(
        ".edit-button"
    );

const saveButtons =
    document.querySelectorAll(
        ".save-field-button"
    );

const cancelButtons =
    document.querySelectorAll(
        ".cancel-field-button"
    );


// =====================================
// EDIT FIELD
// =====================================

editButtons.forEach(
    (button) => {

        if (
            button.id ===
            "editMobileButton"
        ) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                const field =
                    button.dataset.field;

                const input =
                    document.getElementById(
                        field
                    );

                if (!input) {
                    return;
                }


                // Store old value

                input.dataset.originalValue =
                    input.value;


                // Enable field

                input.disabled =
                    false;

                input.focus();


                // Hide Edit

                button.hidden =
                    true;


                // Show Save

                const saveButton =
                    document.querySelector(
                        `.save-field-button[data-field="${field}"]`
                    );

                saveButton.hidden =
                    false;


                // Show Cancel

                const cancelButton =
                    document.querySelector(
                        `.cancel-field-button[data-field="${field}"]`
                    );

                cancelButton.hidden =
                    false;

            }
        );

    }
);


// =====================================
// CANCEL FIELD
// =====================================

cancelButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const field =
                    button.dataset.field;

                const input =
                    document.getElementById(
                        field
                    );

                if (!input) {
                    return;
                }


                // Restore old value

                input.value =
                    input.dataset.originalValue ||
                    "";


                // Disable

                input.disabled =
                    true;


                // Buttons

                const editButton =
                    document.querySelector(
                        `.edit-button[data-field="${field}"]`
                    );

                const saveButton =
                    document.querySelector(
                        `.save-field-button[data-field="${field}"]`
                    );


                editButton.hidden =
                    false;

                saveButton.hidden =
                    true;

                button.hidden =
                    true;


                showMessage("");

            }
        );

    }
);


// =====================================
// SAVE INDIVIDUAL FIELD
// =====================================

saveButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            async () => {

                const field =
                    button.dataset.field;

                const input =
                    document.getElementById(
                        field
                    );

                if (!input) {
                    return;
                }


                const value =
                    input.value.trim();


                // Empty check

                if (!value) {

                    showMessage(
                        "Please enter a value."
                    );

                    input.focus();

                    return;
                }


                showMessage(
                    "Updating..."
                );


                try {

                    const updateData = {

                        userId:
                            currentUser.id

                    };


                    // ONLY THIS FIELD

                    updateData[field] =
                        value;


                    const response =
                        await fetch(
                            "/api/profile/update",
                            {

                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        updateData
                                    )

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        showMessage(
                            data.message ||
                            "Unable to update."
                        );

                        return;
                    }


                    // Update local user

                    currentUser[field] =
                        data.user[field];


                    localStorage.setItem(
                        "loggedInUser",
                        JSON.stringify(
                            currentUser
                        )
                    );


                    // Disable field

                    input.disabled =
                        true;


                    // Buttons

                    const editButton =
                        document.querySelector(
                            `.edit-button[data-field="${field}"]`
                        );

                    const cancelButton =
                        document.querySelector(
                            `.cancel-field-button[data-field="${field}"]`
                        );


                    editButton.hidden =
                        false;

                    button.hidden =
                        true;

                    cancelButton.hidden =
                        true;


                    showMessage(
                        "✅ Updated successfully."
                    );


                } catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    showMessage(
                        "Something went wrong."
                    );

                }

            }
        );

    }
);


// =====================================
// CHANGE PROFILE PHOTO
// =====================================

changePhotoButton.addEventListener(
    "click",
    () => {

        profilePictureInput.click();

    }
);


// =====================================
// PHOTO SELECT
// RESIZE + COMPRESS + SAVE
// =====================================

profilePictureInput.addEventListener(
    "change",
    () => {

        const file =
            profilePictureInput.files[0];

        if (!file) {
            return;
        }


        // Image validation

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please select an image file."
            );

            profilePictureInput.value =
                "";

            return;
        }


        // Original file max 10 MB

        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "Image must be less than 10 MB."
            );

            profilePictureInput.value =
                "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const image =
                    new Image();


                image.onload =
                    function () {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        // Maximum image size

                        const maxSize =
                            500;


                        let width =
                            image.width;

                        let height =
                            image.height;


                        // Resize

                        if (
                            width > maxSize ||
                            height > maxSize
                        ) {

                            if (
                                width > height
                            ) {

                                height =
                                    Math.round(
                                        height *
                                        maxSize /
                                        width
                                    );

                                width =
                                    maxSize;

                            } else {

                                width =
                                    Math.round(
                                        width *
                                        maxSize /
                                        height
                                    );

                                height =
                                    maxSize;

                            }

                        }


                        canvas.width =
                            width;

                        canvas.height =
                            height;


                        const context =
                            canvas.getContext(
                                "2d"
                            );


                        context.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );


                        // Compress

                        const compressedImage =
                            canvas.toDataURL(
                                "image/jpeg",
                                0.70
                            );


                        // Show preview

                        profilePicture.src =
                            compressedImage;


                        // Save to database

                        saveProfilePicture(
                            compressedImage
                        );

                    };


                image.src =
                    event.target.result;

            };


        reader.readAsDataURL(file);

    }
);


// =====================================
// SAVE PROFILE PHOTO TO DATABASE
// =====================================

async function saveProfilePicture(
    imageData
) {

    showMessage(
        "Saving profile photo..."
    );


    try {

        const response =
            await fetch(
                "/api/profile/update",
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            userId:
                                currentUser.id,

                            profilePicture:
                                imageData

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            showMessage(
                data.message ||
                "Unable to save profile photo."
            );

            return;
        }


        // Update localStorage

        currentUser.profilePicture =
            data.user.profilePicture;


        localStorage.setItem(
            "loggedInUser",
            JSON.stringify(
                currentUser
            )
        );


        // Show saved photo

        profilePicture.src =
            data.user.profilePicture;


        showMessage(
            "✅ Profile photo updated successfully."
        );


        // Clear file input

        profilePictureInput.value =
            "";


    } catch (error) {

        console.error(
            "Profile photo error:",
            error
        );


        showMessage(
            "Unable to save profile photo."
        );

    }

}


// =====================================
// MOBILE EDIT
// =====================================

editMobileButton.addEventListener(
    "click",
    () => {

        alert(
            "Mobile number change will be added with OTP verification."
        );

    }
);


// =====================================
// CHANGE PASSWORD
// =====================================

changePasswordButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "/forgot-password.html";

    }
);


// =====================================
// BACK BUTTON
// =====================================

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "/users.html";

    }
);


// =====================================
// START
// =====================================

loadProfile();