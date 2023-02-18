window.onload = checkSession();
function checkSession() {
    if (localStorage.length >= 2) {
        document.getElementById("login").style.display = "none";
    }
}