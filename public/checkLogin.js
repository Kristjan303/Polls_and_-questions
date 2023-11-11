window.onload = checkSession();

function checkSession() {
    // Check if the user is logged in
    if (localStorage.getItem("loggedIn")) {
        // User is logged in, allow the Friends link to redirect
        document.getElementById("friendsLink").addEventListener("click", function () {
            window.location.href = "/friends";
        }),
        document.getElementById("profileLink").addEventListener("click", function () {
            window.location.href = "/profile";
        });

        // Hide the login buttons
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("mainLoginBtn").style.display = "none";
        document.getElementById('logoutBtn').style.display = "";
    } else {
        // User is not logged in, show the login modal on click
        document.getElementById("friendsLink").addEventListener("click", function (event) {
            event.preventDefault();
            var loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
            loginModal.show();
        });
        document.getElementById("profileLink").addEventListener("click", function (event) {
            event.preventDefault();
            var loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
            loginModal.show();
        });
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
