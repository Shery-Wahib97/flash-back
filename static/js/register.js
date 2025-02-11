let firstname = document.querySelector("#firstname");
let lastname = document.querySelector("#lastname");
let username = document.querySelector("#username");
let password = document.querySelector("#password");
const form = document.getElementById("register_form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    console.log(data);
    try {
        const response = await fetch("http://127.0.0.1:5000/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(data),
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log(response);

        const result = await response.json();
        console.log(result);
        window.location.href = "index.html"

    } catch (error) {
        console.error("Error:", error.message);
        alert("Error!")
    }

})
