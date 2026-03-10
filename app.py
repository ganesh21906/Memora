"""
Memora — Streamlit Frontend
Context-Aware Personal Executive: a unified AI memory layer.
"""
import time
import httpx
import streamlit as st

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Memora — Your AI Memory",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded",
)

BACKEND_URL = "http://localhost:8000"

EXAMPLE_QUERIES = [
    "What did we finalize about the event logistics?",
    "Remind me about the catering decisions for the gala",
    "What is the status of our AV setup?",
    "Who are the vendors and what are their costs?",
    "What transportation was arranged for the event?",
    "Summarize the budget for the annual gala",
]

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* Dark gradient background */
.stApp {
    background: linear-gradient(135deg, #0a0e1a 0%, #0f1628 50%, #0a0f1e 100%);
    color: #e2e8f0;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0d1224 0%, #111827 100%);
    border-right: 1px solid rgba(99, 102, 241, 0.2);
}

/* Main header glow */
.memora-header {
    text-align: center;
    padding: 2rem 0 1rem 0;
}
.memora-title {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c084fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -1px;
}
.memora-subtitle {
    font-size: 1rem;
    color: #94a3b8;
    margin-top: 0.25rem;
}

/* Chat messages */
.user-bubble {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 18px 18px 4px 18px;
    padding: 0.9rem 1.2rem;
    margin: 0.5rem 0;
    max-width: 80%;
    margin-left: auto;
    color: white;
    box-shadow: 0 4px 20px rgba(79,70,229,0.3);
}
.ai-bubble {
    background: linear-gradient(135deg, #1e293b 0%, #1a2744 100%);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 18px 18px 18px 4px;
    padding: 0.9rem 1.2rem;
    margin: 0.5rem 0;
    max-width: 90%;
    color: #e2e8f0;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
.ai-bubble p { margin: 0.3rem 0; }

/* Tool badges */
.tool-badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    margin: 0.1rem;
}
.badge-email  { background:#1e3a5f; color:#60a5fa; border:1px solid #3b82f6; }
.badge-pdf    { background:#3b1f1f; color:#f87171; border:1px solid #ef4444; }
.badge-txt    { background:#1a3326; color:#4ade80; border:1px solid #22c55e; }
.badge-csv    { background:#2d1f3b; color:#c084fc; border:1px solid #a855f7; }
.badge-whatsapp { background:#1a2e1a; color:#25d366; border:1px solid #25d366; }

/* Input box */
.stTextInput > div > div > input {
    background: rgba(30,41,59,0.8) !important;
    border: 1px solid rgba(99,102,241,0.4) !important;
    border-radius: 12px !important;
    color: #e2e8f0 !important;
    padding: 0.75rem 1rem !important;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
    border: none !important;
    border-radius: 10px !important;
    color: white !important;
    font-weight: 600 !important;
    padding: 0.5rem 1.2rem !important;
    transition: all 0.2s ease !important;
}
.stButton > button:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(79,70,229,0.4) !important;
}

.example-btn > button {
    background: rgba(30,41,59,0.6) !important;
    border: 1px solid rgba(99,102,241,0.3) !important;
    border-radius: 8px !important;
    font-size: 0.78rem !important;
    text-align: left !important;
    width: 100% !important;
    color: #94a3b8 !important;
    padding: 0.4rem 0.8rem !important;
    margin-bottom: 0.2rem !important;
    font-weight: 400 !important;
}
.example-btn > button:hover {
    border-color: rgba(99,102,241,0.7) !important;
    color: #c4b5fd !important;
    transform: none !important;
}

/* Status bar */
.status-bar {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 10px;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
    align-items: center;
}

/* Divider */
.section-divider {
    border: none;
    border-top: 1px solid rgba(99,102,241,0.15);
    margin: 1rem 0;
}

/* Scrollable chat area */
.chat-container { max-height: 65vh; overflow-y: auto; }

/* File uploader */
[data-testid="stFileUploader"] {
    background: rgba(15,23,42,0.8) !important;
    border: 1px dashed rgba(99,102,241,0.4) !important;
    border-radius: 12px !important;
}

/* Hide Streamlit branding */
#MainMenu, footer, header { visibility: hidden; }
</style>
""", unsafe_allow_html=True)


# ── Session state ─────────────────────────────────────────────────────────────
if "messages" not in st.session_state:
    st.session_state.messages = []
if "pending_query" not in st.session_state:
    st.session_state.pending_query = ""


# ── Helper functions ──────────────────────────────────────────────────────────
def get_tool_badge(tool: str) -> str:
    badges = {
        "search_email":       '<span class="tool-badge badge-email">📧 Email</span>',
        "search_pdf":         '<span class="tool-badge badge-pdf">📄 PDF</span>',
        "search_txt":         '<span class="tool-badge badge-txt">📝 Notes</span>',
        "search_csv":         '<span class="tool-badge badge-csv">📊 CSV</span>',
        "search_attachments": '<span class="tool-badge badge-email">📎 Attachments</span>',
        "search_whatsapp":    '<span class="tool-badge badge-whatsapp">💬 WhatsApp</span>',
    }
    return badges.get(tool, f'<span class="tool-badge badge-email">{tool}</span>')


def check_backend() -> dict | None:
    try:
        r = httpx.get(f"{BACKEND_URL}/health", timeout=3)
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def query_backend(user_query: str) -> dict | None:
    try:
        r = httpx.post(
            f"{BACKEND_URL}/query",
            json={"query": user_query},
            timeout=60,
        )
        return r.json()
    except httpx.ConnectError:
        return {"error": "Cannot connect to backend. Is `uvicorn backend.main:app --reload` running?"}
    except Exception as e:
        return {"error": str(e)}


def upload_file(file) -> str:
    try:
        r = httpx.post(
            f"{BACKEND_URL}/upload",
            files={"file": (file.name, file.getvalue(), file.type)},
            timeout=30,
        )
        data = r.json()
        return data.get("message", "Upload complete.")
    except Exception as e:
        return f"Upload failed: {e}"


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🧠 Memora")
    st.markdown("<p style='color:#64748b;font-size:0.8rem;margin-top:-0.5rem;'>Context-Aware Personal Executive</p>", unsafe_allow_html=True)
    st.markdown("<hr style='border-color:rgba(99,102,241,0.2)'>", unsafe_allow_html=True)

    # Backend status
    health = check_backend()
    if health:
        mode_label = "🟢 Demo Mode" if health.get("mode") == "demo" else "🔵 Gmail Live"
        st.markdown(f"**Status:** {mode_label}")
        st.markdown(f"**Model:** `{health.get('model', 'gemini-2.0-flash')}`")
    else:
        st.markdown("🔴 **Backend Offline**")
        st.markdown(
            "<p style='color:#f87171;font-size:0.78rem;'>Run: <code>uvicorn backend.main:app --reload</code></p>",
            unsafe_allow_html=True,
        )

    st.markdown("<hr style='border-color:rgba(99,102,241,0.2)'>", unsafe_allow_html=True)

    # File upload
    st.markdown("#### 📂 Upload Documents")
    st.markdown("<p style='color:#64748b;font-size:0.78rem;'>PDF, TXT, CSV files will be searched automatically.</p>", unsafe_allow_html=True)
    uploaded = st.file_uploader(
        "Drop files here",
        type=["pdf", "txt", "csv", "md"],
        label_visibility="collapsed",
    )
    if uploaded:
        with st.spinner("Uploading…"):
            msg = upload_file(uploaded)
        st.success(msg)

    st.markdown("<hr style='border-color:rgba(99,102,241,0.2)'>", unsafe_allow_html=True)

    # List uploaded files
    try:
        r = httpx.get(f"{BACKEND_URL}/uploads", timeout=3)
        if r.status_code == 200:
            files = r.json().get("files", [])
            if files:
                st.markdown("#### 📎 Indexed Files")
                for f in files:
                    size_kb = f["size_bytes"] // 1024
                    st.markdown(f"<p style='font-size:0.78rem;color:#94a3b8;margin:0.1rem 0;'>📄 {f['name']} <span style='color:#475569;'>({size_kb} KB)</span></p>", unsafe_allow_html=True)
    except Exception:
        pass

    st.markdown("<hr style='border-color:rgba(99,102,241,0.2)'>", unsafe_allow_html=True)

    # Clear chat
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()


# ── Main area ─────────────────────────────────────────────────────────────────
st.markdown("""
<div class="memora-header">
    <div class="memora-title">🧠 Memora</div>
    <div class="memora-subtitle">Your Context-Aware Personal Executive — Ask anything across your emails & documents</div>
</div>
""", unsafe_allow_html=True)

# Example queries
if not st.session_state.messages:
    st.markdown("<p style='text-align:center;color:#64748b;font-size:0.85rem;margin:1rem 0 0.5rem 0;'>✨ Try asking:</p>", unsafe_allow_html=True)
    cols = st.columns(2)
    for i, example in enumerate(EXAMPLE_QUERIES):
        col = cols[i % 2]
        with col:
            with st.container():
                st.markdown('<div class="example-btn">', unsafe_allow_html=True)
                if st.button(example, key=f"ex_{i}"):
                    st.session_state.pending_query = example
                st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<hr style='border-color:rgba(99,102,241,0.1);margin:1rem 0;'>", unsafe_allow_html=True)

# Chat history
for msg in st.session_state.messages:
    if msg["role"] == "user":
        st.markdown(f'<div class="user-bubble">💬 {msg["content"]}</div>', unsafe_allow_html=True)
    else:
        tools_html = ""
        if msg.get("tools_called"):
            badges = " ".join(get_tool_badge(t) for t in msg["tools_called"])
            elapsed = msg.get("elapsed", "")
            tools_html = f'<div style="margin-bottom:0.5rem;">{badges} <span style="color:#475569;font-size:0.7rem;">⏱ {elapsed}s</span></div>'
        content = msg["content"].replace("\n", "<br>")
        st.markdown(
            f'<div class="ai-bubble">{tools_html}<div>{content}</div></div>',
            unsafe_allow_html=True,
        )

# ── Query input ───────────────────────────────────────────────────────────────
st.markdown("<br>", unsafe_allow_html=True)
with st.form("query_form", clear_on_submit=True):
    col_input, col_btn = st.columns([6, 1])
    with col_input:
        user_input = st.text_input(
            "Ask Memora anything…",
            value=st.session_state.pending_query,
            placeholder="e.g. What did we decide about event logistics?",
            label_visibility="collapsed",
        )
    with col_btn:
        submitted = st.form_submit_button("Send →", use_container_width=True)

# Reset pending query
if st.session_state.pending_query:
    st.session_state.pending_query = ""

if submitted and user_input.strip():
    # Add user message
    st.session_state.messages.append({"role": "user", "content": user_input})

    # Call backend
    with st.spinner("🔍 Memora is searching your knowledge base…"):
        result = query_backend(user_input)

    if result and "error" in result:
        st.session_state.messages.append({
            "role": "assistant",
            "content": f"⚠️ {result['error']}",
            "tools_called": [],
            "elapsed": 0,
        })
    elif result:
        st.session_state.messages.append({
            "role": "assistant",
            "content": result.get("answer", "No answer returned."),
            "tools_called": result.get("tools_called", []),
            "elapsed": result.get("elapsed_seconds", 0),
        })

    st.rerun()
