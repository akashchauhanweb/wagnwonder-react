function TopPageLoader({ active }) {
  if (!active) return null;

  return (
    <div
      className="login-loader-line"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "4px",
        width: "100%",
        zIndex: 10
      }}
    ></div>
  );
}

export default TopPageLoader;
