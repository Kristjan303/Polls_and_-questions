window.onload = checkSession();
function checkSession() {
    if (localStorage.length >= 2) {
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById('logoutBtn').style.display = ""
    }
}

function clearInputs() {
    var inputs = document.getElementsByTagName('input');
    var sErrorMessages = document.getElementById('s-error-msg');
    var rErrorMessages = document.getElementById('r-error-msg');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    if (sErrorMessages) {
        sErrorMessages.innerHTML = '';
    }
    if (rErrorMessages) {
        rErrorMessages.innerHTML = '';
    }
}
