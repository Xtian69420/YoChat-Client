let activeCribId = null; // your existing logic should update this when a crib is selected
function showToast(message) {
    const toastEl = document.getElementById("mainToast");
    const toastBody = document.getElementById("mainToastBody");
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("yochat_user"));
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    // update profile picture
    const profileImg = document.querySelector(".navbar .rounded-circle");
    profileImg.src = user.pfpLink;
    profileImg.alt = user.username;

    // 👇 move profile modal logic here so it sees `user`
    const profilePicNav = document.querySelector(".navbar .rounded-circle");
    const profileModalPic = document.getElementById("profileModalPic");
    const profileModalUsername = document.getElementById("profileModalUsername");
    const profileModalGender = document.getElementById("profileModalGender");
    const profileModalJoined = document.getElementById("profileModalJoined");
    const editUsername = document.getElementById("editUsername");
    const editGender = document.getElementById("editGender");
    const editBtn = document.getElementById("editProfileBtn");
    const saveBtn = document.getElementById("saveProfileBtn");

    profilePicNav.addEventListener("click", async () => {
        try {
            const res = await fetch(`https://yochat-zp3d.onrender.com/user/${user._id}`);
            const data = await res.json();
            if (res.ok) {
                profileModalPic.src = data.pfpLink;
                profileModalUsername.textContent = data.username;
                profileModalGender.textContent = data.gender;
                editUsername.value = data.username;
                editGender.value = data.gender;

                const joinedDate = new Date(data.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric"
                });
                profileModalJoined.textContent = joinedDate;
                new bootstrap.Modal(document.getElementById("profileModal")).show();
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    });

    editBtn.addEventListener("click", () => {
        editUsername.classList.remove("d-none");
        editGender.classList.remove("d-none");
        profileModalUsername.classList.add("d-none");
        profileModalGender.classList.add("d-none");
        saveBtn.classList.remove("d-none");
        editBtn.classList.add("d-none");

        profileModalPic.style.border = "2px solid white";
        profileModalPic.title = "Click to upload new picture";
    });

    profileModalPic.addEventListener("click", () => {
        if (saveBtn.classList.contains("d-none")) return;
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    profileModalPic.src = reader.result;
                    window.newProfileImage = reader.result;
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    });

    saveBtn.addEventListener("click", async () => {
        showLoading();
        try {
            const updated = {
                username: editUsername.value,
                gender: editGender.value,
                pfpLink: window.newProfileImage || profileModalPic.src
            };
            const res = await fetch(`https://yochat-zp3d.onrender.com/user/update/${user._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated)
            });
            if (res.ok) {
                showToast("Profile updated!");
                user.pfpLink = updated.pfpLink;
                localStorage.setItem("yochat_user", JSON.stringify(user));
                hideLoading();
                location.reload();
            } else {
                hideLoading();
                showToast("Failed to update profile");
            }
        } catch (err) {
            hideLoading();
            console.error("Save error", err);
        }
    });

    // keep your other DOMContentLoaded code below this
});

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("yochat_user"));
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const profileImg = document.querySelector(".navbar .rounded-circle");
    profileImg.src = user.pfpLink;
    profileImg.alt = user.username;

    // put this near the top of your JS

    async function loadMessages(cribId, cribName, cribImg) {
        try {
            const cribRes = await fetch(`https://yochat-zp3d.onrender.com/crib/${cribId}`);
            const cribData = await cribRes.json();

            if (cribRes.ok && cribData.messages) {
                const chatHeader = document.querySelector(".chat-header");
                chatHeader.style.display = "flex";
                const headerImg = chatHeader.querySelector("img");
                headerImg.style.display = "block";
                headerImg.src = cribImg;
                chatHeader.querySelector(".chat-name").textContent = cribName;

                const messagesContainer = document.querySelector(".chat-messages");
                messagesContainer.innerHTML = "";
                messagesContainer.classList.remove("justify-content-center", "align-items-center");
                messagesContainer.style.height = "auto";

                document.querySelector(".chat-input").style.display = "flex";

                let previousUserId = null;

                cribData.messages.forEach((msg) => {
                    const isMe = msg.userId === user._id;
                    const isFirstOfSequence = previousUserId !== msg.userId;
                    previousUserId = msg.userId;

                    let timestamp = "";
                    if (msg.dateTime) {
                        const messageDate = new Date(msg.dateTime);
                        const now = new Date();

                        const isToday =
                            messageDate.getDate() === now.getDate() &&
                            messageDate.getMonth() === now.getMonth() &&
                            messageDate.getFullYear() === now.getFullYear();

                        if (isToday) {
                            // show time if today
                            timestamp = new Intl.DateTimeFormat("en-PH", {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                                timeZone: "Asia/Manila",
                            }).format(messageDate);
                        } else {
                            // show date if not today
                            timestamp = new Intl.DateTimeFormat("en-PH", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                                timeZone: "Asia/Manila",
                            }).format(messageDate);
                        }
                    }

                    const timeHtml = isFirstOfSequence && timestamp
                        ? `<span class="small text-muted">${timestamp}</span>`
                        : "";

                    const bubbleHTML = `
                        <div class="message ${isMe ? "me" : "other"} d-flex align-items-end mb-2">
                            ${
                                !isMe && isFirstOfSequence
                                    ? `<img src="${msg.pfpLink}" alt="${msg.username}" class="rounded-circle me-2" width="30" height="30">`
                                    : !isMe
                                    ? `<div style="width:30px; margin-right:8px;"></div>`
                                    : ""
                            }
                            <div>
                                ${
                                    isFirstOfSequence && !isMe
                                        ? `
                                                <div class="d-flex align-items-center mb-1">
                                                    <span class="fw-semibold text-white username">${msg.username}</span>
                                                    <span class="ms-2" style="font-size:9px; color:white;">${timestamp}</span>
                                                </div>
                                            `
                                        : ""
                                }
                                ${
                                    isFirstOfSequence && isMe
                                        ? `
                                                <div class="d-flex justify-content-end mb-1">
                                                    <span style="font-size:9px; color:white;">${timestamp}</span>
                                                </div>
                                            `
                                        : ""
                                }
                                <div class="bubble">${msg.message}</div>
                            </div>
                        </div>
                    `;

                    messagesContainer.insertAdjacentHTML("beforeend", bubbleHTML);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (err) {
            console.error("Failed to load crib messages", err);
        }
    }

    async function refreshMessages(cribId, cribName, cribImg) {
    try {
        const cribRes = await fetch(`https://yochat-zp3d.onrender.com/crib/${cribId}`);
        const cribData = await cribRes.json();

        if (cribRes.ok && cribData.messages) {
            const messagesContainer = document.querySelector(".chat-messages");

            // measure distance from bottom
            const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
            const isNearBottom = distanceFromBottom < 100;

            messagesContainer.innerHTML = "";  // refresh messages

            let previousUserId = null;

            cribData.messages.forEach((msg) => {
                const isMe = msg.userId === user._id;
                const isFirstOfSequence = previousUserId !== msg.userId;
                previousUserId = msg.userId;

                let timestamp = "";
                if (msg.dateTime) {
                    const messageDate = new Date(msg.dateTime);
                    const now = new Date();
                    const isToday = messageDate.toDateString() === now.toDateString();
                    timestamp = isToday
                        ? new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "numeric", hour12: true }).format(messageDate)
                        : new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(messageDate);
                }

                const timeHtml = isFirstOfSequence && timestamp
                    ? `<span class="small text-muted">${timestamp}</span>`
                    : "";

                const bubbleHTML = `
                    <div class="message ${isMe ? "me" : "other"} d-flex align-items-end mb-2">
                        ${
                            !isMe && isFirstOfSequence
                                ? `<img src="${msg.pfpLink}" alt="${msg.username}" class="rounded-circle me-2" width="30" height="30">`
                                : !isMe
                                ? `<div style="width:30px; margin-right:8px;"></div>`
                                : ""
                        }
                        <div>
                            ${
                                isFirstOfSequence && !isMe
                                    ? `<div class="d-flex align-items-center mb-1">
                                        <span class="fw-semibold text-white username">${msg.username}</span>
                                        <span class="ms-2" style="font-size:9px; color:white;">${timestamp}</span>
                                    </div>`
                                    : ""
                            }
                            ${
                                isFirstOfSequence && isMe
                                    ? `<div class="d-flex justify-content-end mb-1">
                                        <span style="font-size:9px; color:white;">${timestamp}</span>
                                    </div>`
                                    : ""
                            }
                            <div class="bubble">${msg.message}</div>
                        </div>
                    </div>
                `;


                messagesContainer.insertAdjacentHTML("beforeend", bubbleHTML);
            });

            if (isNearBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    } catch (err) {
        console.error("Failed to refresh messages", err);
    }
}

setInterval(async () => {
    if (activeCribId) {
        const activeCard = document.querySelector(`.chat-card[data-crib-id="${activeCribId}"]`);
        if (activeCard) {
            await refreshMessages(
                activeCribId,
                activeCard.dataset.cribName,
                activeCard.dataset.img
            );
        }
    }
}, 3000);



    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "../index.html";
    });

    try {
        const res = await fetch(`https://yochat-zp3d.onrender.com/cribs/user/${user._id}`);
        const data = await res.json();

        if (res.ok && data.cribs) {
            const sidebar = document.querySelector(".chat-card-stack");
            const mobileSidebar = document.querySelector(".offcanvas-body .chat-card-stack");

            sidebar.innerHTML = "";
            mobileSidebar.innerHTML = "";

            data.cribs.forEach((crib) => {
                const randomImg = `https://picsum.photos/40?${Math.floor(Math.random() * 1000)}`;
                let lastMessage = crib.messages?.slice(-1)[0]?.message || 'No messages yet';
                if (lastMessage.length > 25) {
                    lastMessage = lastMessage.slice(0, 25) + '...';
                }

                const chatCardHTML = `
                    <div class="chat-card" data-crib-id="${crib._id}" data-crib-name="${crib.name}" data-img="${randomImg}">
                        <img src="${randomImg}" alt="${crib.name}">
                        <div class="chat-info">
                            <span class="name">${crib.name}</span>
                            <span class="last-message">${lastMessage}</span>
                        </div>
                    </div>
                `;

                sidebar.insertAdjacentHTML("beforeend", chatCardHTML);
                mobileSidebar.insertAdjacentHTML("beforeend", chatCardHTML);
            });

            document.querySelectorAll(".chat-card").forEach((card) => {
                card.addEventListener("click", async () => {
                    activeCribId = card.dataset.cribId;
                    const cribName = card.dataset.cribName;
                    const cribImg = card.dataset.img;
                    await loadMessages(activeCribId, cribName, cribImg);

                    const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("mobileChatSidebar"));
                    if (offcanvas) offcanvas.hide();
                });
            });
        }
    } catch (err) {
        console.error("Failed to load cribs", err);
    }

    document.querySelector(".chat-input").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = e.target.querySelector("input");
        const message = input.value.trim();
        if (!message || !activeCribId) return;

        try {
            await fetch(`https://yochat-zp3d.onrender.com/crib/${activeCribId}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId: user._id,
                    message
                })
            });
            input.value = "";
            // just reload the messages after sending
            const activeCard = document.querySelector(`.chat-card[data-crib-id="${activeCribId}"]`);
            await loadMessages(
                activeCribId,
                activeCard.dataset.cribName,
                activeCard.dataset.img
            );
        } catch (err) {
            console.error("Failed to send message", err);
        }
    });

});

document.getElementById("createCribForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const key = e.target.key.value.trim();
    const creatorId = JSON.parse(localStorage.getItem("yochat_user"))._id;

    try {
        showLoading();
        const res = await fetch("https://yochat-zp3d.onrender.com/crib/create", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ name, key, creatorId })
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("createCribModal")).hide();
            showToast("Crib created successfully!");
            hideLoading();
            location.reload(); // refresh to update
        } else {
            hideLoading();
            showToast("Failed to create crib.");
        }
    } catch (err) {
        hideLoading();
        console.error("Create crib failed", err);
        showToast("Error creating crib.");
    }
});

document.getElementById("joinCribForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const key = e.target.key.value.trim();
    const userId = JSON.parse(localStorage.getItem("yochat_user"))._id;

    try {
        showLoading();
        const res = await fetch("https://yochat-zp3d.onrender.com/crib/join", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ name, key, userId })
        });
        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("joinCribModal")).hide();
            showToast("Successfully joined crib!");
            hideLoading();
            location.reload(); // refresh to update
        } else {
            hideLoading();
            showToast("Failed to join crib.");
        }
    } catch (err) {
        hideLoading();
        console.error("Join crib failed", err);
        showToast("Error joining crib.");
    }
});
