window.onload = checkSession();
function checkSession() {
    if (localStorage.length >= 2) {
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById('logoutBtn').style.display = ""
    }
}

function clearInputs() {
    var inputs = document.getElementsByTagName('input');
    var errorMessages = document.getElementById('s-error-msg');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    var errorMsg = document.getElementById('s-error-msg');
    if (errorMsg) {
        errorMsg.textContent = '';
    }
}