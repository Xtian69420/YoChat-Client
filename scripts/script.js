const api = 'https://yochat-api.onrender.com';

// check on page load if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('yochat_user');
    if (user) {
        // user already logged in, go straight to homepage
        window.location.href = 'pages/homepage.html';
    }
});

function showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
        showLoading();
        const res = await fetch(`${api}/user/create`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok && data.user) {
            // store user data
            localStorage.setItem('yochat_user', JSON.stringify(data.user));
            form.reset();
            bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
            // redirect to homepage
            hideLoading();
            window.location.href = 'pages/homepage.html';
        }
    } catch (err) {
        hideLoading();
        alert('Sign up failed. Please try again.');
    }
});

document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const body = {
        username: form.username.value,
        password: form.password.value
    };

    try {
        showLoading();
        const res = await fetch(`${api}/user/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (res.ok && data.user) {
            localStorage.setItem('yochat_user', JSON.stringify(data.user));
            form.reset();
            bootstrap.Modal.getInstance(document.getElementById('signinModal')).hide();

            hideLoading();
            window.location.href = 'pages/homepage.html';
        }
    } catch (err) {
        hideLoading();
        alert('Sign in failed. Please try again.');
    }
});
