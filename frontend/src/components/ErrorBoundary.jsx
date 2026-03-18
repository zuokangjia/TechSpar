import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={styles.page}>
        <div style={styles.title}>出了点问题</div>
        <div style={styles.message}>{this.state.error?.message || "未知错误"}</div>
        <button
          style={styles.btn}
          onClick={() => this.setState({ error: null })}
        >
          重试
        </button>
        <Link to="/" style={styles.link}>返回首页</Link>
      </div>
    );
  }
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    gap: 16,
    minHeight: "60vh",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "var(--text)",
  },
  message: {
    fontSize: 14,
    color: "var(--text-dim)",
    maxWidth: 400,
    textAlign: "center",
    wordBreak: "break-word",
  },
  btn: {
    marginTop: 8,
    padding: "10px 24px",
    borderRadius: 8,
    background: "var(--accent)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  },
  link: {
    fontSize: 14,
    color: "var(--accent-light)",
    textDecoration: "none",
  },
};
