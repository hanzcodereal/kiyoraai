export default function LoadingScreen() {
  return (
    <div id="loading">
      <div className="ld-avatar">
        <img src="/icon.png" alt="Kiyora" />
      </div>
      <div className="ld-name">
        Kiyora <span>AI</span>
      </div>
      <div className="ld-bar-wrap">
        <div className="ld-bar" id="ld-bar" />
      </div>
      <div className="ld-status" id="ld-status">
        Memuat sistem…
      </div>
    </div>
  );
}
