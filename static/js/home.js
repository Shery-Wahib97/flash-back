////////////////////// ADD MEMORY //////////////////////////

const addForm = document.querySelector("#Add-memory-form");
let images = document.querySelector("#memory-img");
let title = document.querySelector("#memory-title");
let description = document.querySelector("#description");
let date = document.querySelector("#date");

let userID = localStorage.getItem("userID");
console.log("User ID:", userID);

addForm.addEventListener("submit", async (event) => {
    event.preventDefault()
    const formData = new FormData();

    formData.append("user_id", userID);
    for (let i = 0; i < images.files.length; i++) {
        formData.append("images", images.files[i]);
    }
    formData.append("title", title.value);
    formData.append("description", description.value);
    formData.append("date", date.value);
    try {
        const response = await fetch("http://127.0.0.1:5000/api/memories-home", {
            method: "POST",
            body: formData,
            mode: 'cors'
        })

        const result = await response.json()
        if (response.ok) {
            console.log("🎉 Memory added:", result);
            alert("Memory added successfully ✅");
            addForm.reset();
            fetchMemories()
        } else {
            alert(`Server Error: ${result}`);
            return;
        }

    } catch (error) {
        console.error("❌ Fetch Error:", error);
    }
})

///////////////////////// GET MEMORY /////////////////////////////

let output = document.getElementById("output");

async function fetchMemories() {
    let userID = localStorage.getItem("userID");

    if (!userID) {
        return;
    }

    try {
        let response = await fetch(`http://127.0.0.1:5000/api/get-memories/${userID}`);

        if (!response.ok) {
            throw new Error(`❌ Server responded with ${response.status}`);
        }
        let memories = await response.json();
        output.innerHTML = "";

        memories.forEach(memory => {
            if (memory.title && memory.date && memory.description && memory.images) {
                addMemoryToPage(memory);
            } else {
                console.warn("🚨 Memory data missing fields", memory);
            }
        });
        
        let images = document.querySelectorAll(".memory-images");
        images.forEach(img => {
            img.addEventListener("click", () => {
                console.log("trueee");
                
            })
        })
    } catch (error) {
        console.error("❌ Fetch Error:", error);
    }
}

/////// ADD MEMORY TO PAGE FUNCTION 
function addMemoryToPage(memory) {

    let imagesHTML = Array.isArray(memory.images)
        ? memory.images.map(img =>
            `<div class="swiper-slide">
                <img class="img-cards" src="/${img.replace(/\\/g, "/")}" alt="Memory Image">
                </div>`
        ).join("")
        : "";

    let card = `
        <div class="memory-card card"  data-id="${memory.id}">
            <div class="card-header">
                <div class=" memory-images">
                ${imagesHTML}
                </div> 
            </div>
            <div class="card-body">
                <h3 class="memory-title card-title">${memory.title}</h3>
                <p class="memory-description card-text">${memory.description || "No description"}</p>
                <br>
                <p class="memory-date">${memory.date}</p>
            </div>
            <div class="card-footer"> 
                <button type="button" class="btn-close" id="delete-card" name="form-btn" data-bs-dismiss="modal" aria-label="Close"></button>
                <button type="button" class="btn edit-btn" id="edit-card">Edit</button> 
            </div>
        </div>
    `;
    output.innerHTML += card;

    // let images = 
    // images

}

window.addEventListener("load", fetchMemories);

///////////////////////////////////////////////////////////////////////////////////////////

document.addEventListener("click", async function (event) {
    if (event.target && event.target.id === "delete-card") {
        let card = event.target.closest(".memory-card");
        let title = card.querySelector("h3").textContent; 

        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            try {
                let response = await fetch(`http://127.0.0.1:5000/api/delete-memory/${title}`, { 
                    method: "DELETE"
                });

                if (!response.ok) {
                    throw new Error("Failed to delete memory from server.");
                }

                card.remove(); 
                console.log("🗑️ Memory deleted successfully:", title);

            } catch (error) {
                console.error("❌ Error deleting memory:", error);
            }
        }
    }
});


////////////////////////////// EDIT CARD ///////////////////////////////////

document.addEventListener("click", function (event) {
    if (event.target && event.target.id === "edit-card") { 
        let card = event.target.closest(".memory-card");

        if (!card) {
            console.error("🚨 Error: Could not find memory card!");
            return;
        }

        let titleElement = card.querySelector(".memory-title");
        let dateElement = card.querySelector(".memory-date");
        let descriptionElement = card.querySelector(".memory-description");

        if (!titleElement || !dateElement || !descriptionElement) { 
            console.error("🚨 Error: One or more fields are missing in the memory card!");
            return;
        }

        let memoryID = card.getAttribute("data-id"); 
        let title = titleElement.textContent;
        let date = dateElement.textContent;
        let description = descriptionElement.textContent;

        document.getElementById("edit-old-id").value = memoryID;
        document.getElementById("edit-title").value = title;
        document.getElementById("edit-date").value = date;
        document.getElementById("edit-description").value = description;

        let editModal = new bootstrap.Modal(document.getElementById("editModal"));
        editModal.show();
    }
});
////////////////////////SUBMIT EDIT FORM ACTION //////////////////////////
document.getElementById("edit-memory-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    let memoryID = document.getElementById("edit-old-id").value;
    let newTitle = document.getElementById("edit-title").value;
    let newDate = document.getElementById("edit-date").value;
    let newDescription = document.getElementById("edit-description").value;
    let newImages = document.getElementById("edit-images").files;

    let formData = new FormData();
    formData.append("user_id", localStorage.getItem("userID"));
    formData.append("title", newTitle);
    formData.append("date", newDate);
    formData.append("description", newDescription);
    for (let i = 0; i < newImages.length; i++) {
        formData.append("images", newImages[i]);
    }
    try {
        let response = await fetch(`http://127.0.0.1:5000/api/update-memory/${memoryID}`, {
            method: "PUT",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to update memory.");
        }

        let updatedMemory = await response.json();
        let card = document.querySelector(`.memory-card[data-id="${memoryID}"]`);
        if (card) {
            card.querySelector(".memory-title").textContent = newTitle;
            card.querySelector(".memory-date").textContent = newDate;
            card.querySelector(".memory-description").textContent = newDescription;

            let imagesContainer = card.querySelector(".memory-images");
            imagesContainer.innerHTML = updatedMemory.memory.images.map(img =>
                `<img src="/${img.replace(/\\/g, "/")}" alt="Memory Image">`
            ).join("");
        }

    } catch (error) {
        console.error("❌ Error updating memory:", error);
    }
});

//////////////////// LOGOUT //////////////////////////////
document.getElementById("logOut").addEventListener("click", async () => {
    if (confirm("Are you sure you want to log out?")) {
        await fetch("http://127.0.0.1:5000/api/logout", {
            method: "POST",
            credentials: "include"
        })
        try {
            let response = await fetch("http://127.0.0.1:5000/api/logout", {
                method: "POST",
                credentials: "include"
            });
            if (!response.ok) {
                throw new Error("Failed to update memory.");
            }
            const data = await response.json();
            console.log(data.message);

            sessionStorage.clear();
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout error:", error);
        }
    }
});

// fetch("http://127.0.0.1:5000/api/check_session", {
//     method: "GET",
//     credentials: "include"
// })
//     .then(response => response.json())
//     .then(data => {
//         if (data.logged_in) {
//             console.log("User Logged In:", data.username);
//             sessionStorage.setItem("username", data.username);
//             sessionStorage.setItem("password", data.password);
//             sessionStorage.setItem("userID", data.id);
//             document.getElementById("user-info").innerText = `Welcome, ${data.username}`;
//         } else {
//             console.log("User not logged in.");
//         }
//     })
//     .catch(error => console.error("Error fetching session data:", error));

// fetch("http://127.0.0.1:5000/api/check_session", {
//     method: "GET",
//     credentials: "include"
// })
//     .then(response => response.json().then(data => ({ status: response.status, body: data })))
//     .then(result => {
//         console.log("Response Status:", result.status);
//         console.log("Response Body:", result.body);

//         if (result.body.logged_in) {
//             console.log("User Logged In:", result.body.username);
//             sessionStorage.setItem("username", result.body.username);
//             sessionStorage.setItem("userID", result.body.id);
//             document.getElementById("user-info").innerText = `Welcome, ${result.body.username}`;
//         } else {
//             console.log("User not logged in.");
//         }
//     })
//     .catch(error => console.error("Error fetching session data:", error));
