export function UpgradeGate() {
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center shadow-[0_20px_60px_rgba(20,16,12,0.08)]">
      <p className="text-xs font-semibold tracking-[0.22em] text-[var(--brass)]">
        免費額度已用完
      </p>
      <h2 className="mt-3 font-serif text-3xl text-[var(--ink)]">升級契約哨兵</h2>
      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
        這台裝置的免費初審（1 份合約）已使用。升級後可繼續批次審閱、匯出修改對照，並保留完整標註紀錄。
      </p>
      <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm leading-6 text-[var(--ink)]">
        <li>— 不限份數的 PDF 初審</li>
        <li>— 不對等條款／模糊付款／智財陷阱標註</li>
        <li>— 可複製的條文修改建議</li>
      </ul>
      <button
        type="button"
        className="mt-8 w-full rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-[var(--paper)]"
      >
        即將開放付費方案
      </button>
      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        升級後仍為 AI／規則庫初審，非正式法律意見。
      </p>
    </section>
  );
}
