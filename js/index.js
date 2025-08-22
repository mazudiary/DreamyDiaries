// SHA-256 hashing function
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

  const storedHash = "d76ebaf36c676269f627a0931172d7e8c41dab7e78571041c74c245d6b3b86ba";

    async function unlock() {
  const pwd = document.getElementById('password').value;
  const errorDiv = document.getElementById('error');
  const hashedInput = await hashPassword(pwd);
  console.log('Hashed input:', hashedInput); // Debugging line

  if (hashedInput === storedHash) {
    localStorage.setItem('dreamyDiariesAuth', hashedInput);

    // Create beautiful animation overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(16px)';
    overlay.style.background = 'linear-gradient(135deg, #ffe6f0 0%, #ffb3d9 100%)';
    overlay.style.boxShadow = '0 0 80px 20px #ffb3d9';

    // Animated gradient
    overlay.style.animation = 'gradientMove 4s linear infinite alternate';
    overlay.innerHTML = `
      <style>
        @keyframes gradientMove {
          0% { background: linear-gradient(135deg, #ffe6f0 0%, #ffb3d9 100%); }
          100% { background: linear-gradient(135deg, #ffb3d9 0%, #ffe6f0 100%); }
        }
        .overlay-glow {
          font-size: 2.2rem;
          color: #ff4da6;
          font-weight: bold;
          margin-bottom: 1rem;
          text-shadow: 0 0 18px #ffb3d9, 0 0 32px #ff4da6;
          animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
          0% { text-shadow: 0 0 8px #ffb3d9, 0 0 18px #ff4da6; }
          100% { text-shadow: 0 0 32px #ffb3d9, 0 0 48px #ff4da6; }
        }
        .overlay-poem {
          font-size: 1.3rem;
          color: #d63384;
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 8px #ffe6f0;
        }
        .overlay-favicon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1.2rem auto;
          display: block;
          border-radius: 16px;
          box-shadow: 0 0 16px #ffb3d9;
        }
      </style>
      <img src="assets/favicon.png" class="overlay-favicon" alt="Dreamy Diaries Favicon" />
      <div class="overlay-glow">Loveee, oh my loveee 💖</div>
      <div class="overlay-poem">Loveee and only loveee </div>
      <div class="overlay-poem">The loveee of my loveee, the deepest loveee 💖</div>
    `;
    document.body.appendChild(overlay);

    // Floating hearts on overlay
    const heartInterval = setInterval(() => {
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.style.position = 'absolute';
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.top = Math.random() * 80 + 'vh';
      heart.style.fontSize = Math.random() * 25 + 20 + 'px';
      heart.style.opacity = '0.8';
      heart.style.filter = 'drop-shadow(0 0 8px #ffb3d9)';
      heart.style.animation = `float 6s linear forwards`;
      heart.innerHTML = '💖';
      overlay.appendChild(heart);
      setTimeout(() => heart.remove(), 6000);
    }, 200);

    // Wait 4 seconds, then go to diary.html
    setTimeout(() => {
      clearInterval(heartInterval);
      window.location.href = 'diary.html';
    }, 4000);

  } else {
    errorDiv.textContent = 'Incorrect password. Try again.';
  }
}


    // Auto-login if already authenticated
    /*
    (async function(){
      const auth = localStorage.getItem('dreamyDiariesAuth');
      if(auth) {
        const hashedPwd = await hashPassword('Premii'); // same as stored password
        if(auth === hashedPwd) window.location.href = 'diary.html';
      }
    })();
    */

    function togglePassword() {
      const pwdInput = document.getElementById('password');
      const btn = document.querySelector('.toggle-btn');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        pwdInput.classList.add('visible-password');
        btn.textContent = 'Hide';
      } else {
        pwdInput.type = 'password';
        pwdInput.classList.remove('visible-password');
        btn.textContent = 'Show';
      }
    }

    // Floating hearts
    function createHeart() {
      const heart = document.createElement("div");
      heart.className = "heart";
      heart.innerHTML = "💖";
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.fontSize = Math.random() * 25 + 15 + "px";
      heart.style.animationDuration = Math.random() * 3 + 3 + "s";
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 6000);
    }
    setInterval(createHeart, 800);