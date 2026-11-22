// Prototype auth: accounts & session in LocalStorage. NOT secure — client-side only.
const Auth = (() => {
  const USERS_KEY = "stis-users-v1";
  const SESSION_KEY = "stis-session-v1";

  const DEMO_USERS = [
    { username: "admin", password: "admin123", name: "Administrator", role: "admin" },
    { username: "user",  password: "user123",  name: "Pengguna",      role: "user" }
  ];

  const ROLES = { admin: "Admin", user: "Pengguna" };

  const users = () => [...DEMO_USERS, ...Store.get(USERS_KEY, [])];
  const current = () => Store.get(SESSION_KEY, null);

  function login(username, password) {
    const u = users().find(x => x.username === username.trim().toLowerCase() && x.password === password);
    if (!u) return null;
    const session = { username: u.username, name: u.name, role: u.role };
    Store.set(SESSION_KEY, session);
    return session;
  }

  function register(username, password, name) {
    username = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return "Username 3–20 karakter (huruf kecil, angka, _).";
    if (password.length < 6) return "Password minimal 6 karakter.";
    if (users().some(u => u.username === username)) return "Username sudah dipakai.";
    // Self-registration always creates a regular user.
    Store.set(USERS_KEY, [...Store.get(USERS_KEY, []), { username, password, name: name.trim() || username, role: "user" }]);
    return null;
  }

  // Page guard: redirect unless logged in (with `role`, if given), then fill the
  // header's #user-chip and wire #logout. Returns the session, or null when redirecting.
  function mount(role) {
    const s = current();
    if (!s) { location.replace("login.html"); return null; }
    if (role && s.role !== role) { location.replace("index.html"); return null; }
    document.querySelector("#user-chip").innerHTML = `${esc(s.name)}<small>${ROLES[s.role]}</small>`;
    document.querySelector("#logout").onclick = () => { Store.del(SESSION_KEY); location.href = "login.html"; };
    return s;
  }

  return { DEMO_USERS, login, register, current, mount };
})();
