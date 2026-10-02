/*
  IMPORTANT:
  Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.
  Never put a Supabase service_role key in this file.
*/
const SUPABASE_URL = "https://mqoethcdffzcfdezqbau.supabase.co/";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_15MLcbOAfhf95JEzmvnVUA_6X_blqem";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const loginView = document.querySelector("#loginView");
const chatView = document.querySelector("#chatView");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const loginMsg = document.querySelector("#loginMsg");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const messagesEl = document.querySelector("#messages");
const sendForm = document.querySelector("#sendForm");
const messageInput = document.querySelector("#messageInput");
const userLabel = document.querySelector("#userLabel");

let currentUser = null;
let channel = null;

function showLogin(message = "") {
  loginView.classList.remove("hidden");
  chatView.classList.add("hidden");
  loginMsg.textContent = message;
}

function showChat(user) {
  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  userLabel.textContent = user.email || "";
}

function escapeText(text) {
  return text;
}

function formatTime(value) {
  return new Date(value).toLocaleString();
}

async function loadMessages() {
  messagesEl.innerHTML = "";
  const { data, error } = await supabaseClient
    .from("messages")
    .select("id,user_id,body,created_at,read_at")
    .order("created_at", { ascending: true });

  if (error) {
    messagesEl.innerHTML = `<p class="error">Could not load messages.</p>`;
    console.error(error);
    return;
  }

  for (const m of data) renderMessage(m);

  // Mark messages from the other person as read.
  const unreadIds = data
    .filter(m => m.user_id !== currentUser.id && !m.read_at)
    .map(m => m.id);

  if (unreadIds.length) {
    await supabaseClient
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderMessage(m) {
  const div = document.createElement("div");
  div.className = "msg " + (m.user_id === currentUser.id ? "mine" : "theirs");

  const body = document.createElement("div");
  body.textContent = m.body;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = formatTime(m.created_at) +
    (m.user_id === currentUser.id && m.read_at ? " • Read" : "");

  div.append(body, meta);
  messagesEl.appendChild(div);
}

loginBtn.addEventListener("click", async () => {
  loginMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    loginMsg.textContent = "Email and password required.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email, password
  });

  if (error) {
    loginMsg.textContent = error.message;
    return;
  }

  currentUser = data.user;
  showChat(currentUser);
  await loadMessages();
  subscribeRealtime();
});

logoutBtn.addEventListener("click", async () => {
  if (channel) await supabaseClient.removeChannel(channel);
  channel = null;
  await supabaseClient.auth.signOut();
  currentUser = null;
  showLogin();
});

sendForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = messageInput.value.trim();
  if (!body || !currentUser) return;

  messageInput.value = "";

  const { error } = await supabaseClient.from("messages").insert({
    user_id: currentUser.id,
    body
  });

  if (error) {
    console.error(error);
    alert("Message could not be sent.");
  }
});

function subscribeRealtime() {
  channel = supabaseClient
    .channel("private-chat-messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      payload => {
        renderMessage(payload.new);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (payload.new.user_id !== currentUser.id && !payload.new.read_at) {
          supabaseClient.from("messages")
            .update({ read_at: new Date().toISOString() })
            .eq("id", payload.new.id)
            .then(() => { });
        }
      }
    )
    .subscribe();
}

async function boot() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
    showChat(currentUser);
    await loadMessages();
    subscribeRealtime();
  } else {
    showLogin();
  }
}

boot();

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    const newPassword = prompt("Enter your new password:");

    if (newPassword) {
      supabaseClient.auth.updateUser({
        password: newPassword
      }).then(({ error }) => {
        if (error) {
          alert(error.message);
        } else {
          alert("Password updated successfully!");
        }
      });
    }
  }
});window.addEventListener("pagehide", async () => {
  try {
    await supabaseClient
      .from("messages")
      .delete()
      .not("read_at", "is", null);
  } catch (error) {
    console.log("Read messages cleanup:", error);
  }
});
