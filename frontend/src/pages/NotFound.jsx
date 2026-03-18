import { useNavigate } from "react-router-dom";

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    gap: 12,
    minHeight: "60vh",
  },
  code: {
    fontSize: 64,
    fontWeight: 700,
    color: "var(--text-dim)",
    opacity: 0.3,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--text)",
  },
  desc: {
    fontSize: 14,
    color: "var(--text-dim)",
  },
  btn: {
    marginTop: 12,
    padding: "10px 24px",
    borderRadius: 8,
    background: "var(--accent)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    border: "none",
    cursor: "pointer",
  },
};

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.code}>404</div>
      <div style={styles.title}>页面不存在</div>
      <div style={styles.desc}>你访问的页面可能已移除或地址有误</div>
      <button style={styles.btn} onClick={() => navigate("/")}>
        返回首页
      </button>
    </div>
  );
}
