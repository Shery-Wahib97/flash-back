
let username = document.querySelector("#username");
let password = document.querySelector("#password");
const form = document.querySelector("#login-form");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
        const response = await fetch("http://127.0.0.1:5000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                "username": username.value,
                "password": password.value
            })
        });

        if (!response.ok) {
            throw new Error("Invalid Username or password");
        } else {
            const data = await response.json()
            localStorage.setItem( "loginSuccess", "true")
            localStorage.setItem("userID", data.id);
            
            window.location.href = "home.html"
            console.log(data);
        }

    } catch (error) {
        console.error("Error:", error.message);
        alert(error.message)
    }
})

