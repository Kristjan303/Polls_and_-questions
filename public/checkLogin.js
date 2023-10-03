window.onload = checkSession();
function checkSession() {
    if (localStorage.length >= 2) {
        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("mainLoginBtn").style.display = "none";
        document.getElementById('logoutBtn').style.display = ""
    }
    // check if user is logged in
    if (!localStorage.getItem("loggedIn")) {
        // add event listener to each anchor tag inside mainbar and sidenav
        document.querySelectorAll("nav#mainbar ul li a, nav#sidebar ul li a").forEach(function(element) {
            element.addEventListener("click", function(event) {
                // prevent default anchor tag behavior
                event.preventDefault();
                // open Bootstrap modal
                var loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
                loginModal.show();
            });
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
