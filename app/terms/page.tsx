import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/pricing-tiers";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "服務條款｜契約哨兵",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout title="服務條款" updated="2026-08-28">
      <p>歡迎使用契約哨兵（以下稱「本服務」）。使用本網站即表示你同意本條款。</p>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">1. 服務內容</h2>
        <p className="mt-2">
          本服務協助台灣接案者檢查合約中的常見風險，並提供修改建議與修約信草稿。輸出僅供教育與風險提示，不構成律師法律意見，亦未建立委任關係。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">2. 帳號與裝置</h2>
        <p className="mt-2">
          目前尚未提供登入。付費解鎖係以瀏覽器 Cookie 記錄於你使用的裝置。清除 Cookie、換瀏覽器或換裝置後，可能需要重新解鎖。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">3. 方案</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>入門版：每月可免費分析 1 份合約，僅顯示標題與判決；完整對策需付費。</li>
          <li>單次解鎖：一次付清、不自動續訂。付款後，同一裝置約 31 天可解鎖完整報告（不限份數）。</li>
          {SUBSCRIPTIONS_ENABLED ? (
            <>
              <li>專業版月繳：訂閱，同一裝置約 31 天可解鎖完整報告；到期是否續扣由 Paddle 訂閱設定決定。</li>
              <li>專業版年繳：訂閱，同一裝置約 366 天可解鎖完整報告。</li>
            </>
          ) : null}
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">4. 使用者責任</h2>
        <p className="mt-2">
          你應確保有權上傳或貼上該合約。請勿上傳他人機密文件若你無權處理。本服務可能誤判或漏判，簽約前請自行覆核並於需要時洽詢律師。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">5. 付款</h2>
        <p className="mt-2">
          付款由 Paddle 處理。價格可能依所在國家顯示當地幣別與稅額。訂閱之取消、發票與付款方式變更，請依 Paddle 寄發之收據與客戶入口操作。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">6. 智慧財產</h2>
        <p className="mt-2">
          網站介面、規則說明與產出格式屬本服務。你上傳的合約內容權利仍屬原權利人；本服務不主張取得你的合約著作權。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">7. 責任限制</h2>
        <p className="mt-2">
          在法律允許範圍內，本服務不就漏判、誤判或依建議修改後仍發生之爭議負損害賠償責任。若依法仍須負責，以你就該筆爭議所支付之費用為上限。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">8. 聯絡</h2>
        <p className="mt-2">
          {SUPPORT_EMAIL ? (
            <>
              服務、付款或資料相關問題請寄至{" "}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              。
            </>
          ) : (
            "付款問題可先透過 Paddle 交易通知信中的客服與交易管理連結處理。"
          )}
          本條款得以公告方式更新，更新後繼續使用視為同意。
        </p>
      </section>
    </LegalLayout>
  );
}
