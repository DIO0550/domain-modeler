/** 初期状態へ向かう黒丸と矢印。グラフと凡例で同じ記号を使う。 */
export function StateMachineInitialSymbol() {
  return (
    <>
      <circle
        className="state-machine-screen__initial-dot"
        cx="8"
        cy="10"
        r="7"
      />
      <path
        className="state-machine-screen__initial-arrow"
        d="M 15 10 H 52 M 46 6 L 52 10 L 46 14"
      />
    </>
  );
}

/** パン・ズームに追従せず、図の隅に状態記号の意味を表示する。 */
export function StateMachineGraphLegend() {
  return (
    <ul className="state-machine-screen__legend" aria-label="状態遷移図の凡例">
      <li>
        <svg
          className="state-machine-screen__legend-symbol"
          viewBox="0 0 56 20"
          aria-hidden="true"
        >
          <StateMachineInitialSymbol />
        </svg>
        初期
      </li>
      <li>
        <svg
          className="state-machine-screen__legend-symbol"
          viewBox="0 0 56 28"
          aria-hidden="true"
        >
          <rect x="7" y="2" width="42" height="24" rx="6" />
          <rect
            className="state-machine-screen__terminal-outline"
            x="12"
            y="7"
            width="32"
            height="14"
            rx="3"
          />
        </svg>
        終端
      </li>
      <li>
        <svg
          className="state-machine-screen__legend-symbol"
          data-appearance="unresolved"
          viewBox="0 0 56 28"
          aria-hidden="true"
        >
          <rect x="7" y="2" width="42" height="24" rx="6" />
        </svg>
        未解決
      </li>
      <li>
        <svg
          className="state-machine-screen__legend-symbol"
          data-status="error"
          viewBox="0 0 56 28"
          aria-hidden="true"
        >
          <rect x="7" y="2" width="42" height="24" rx="6" />
        </svg>
        エラー
      </li>
    </ul>
  );
}
