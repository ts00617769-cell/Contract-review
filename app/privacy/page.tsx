import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "隱私權政策｜契約哨兵",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="隱私權政策" updated="2026-08-28">
      <p>
        契約哨兵重視你的合約與個人資料。本政策說明我們處理哪些資訊、為什麼處理，以及保存多久。
      </p>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">1. 我們蒐集什麼</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>你主動上傳或貼上的合約文字，僅用於當次分析。</li>
          <li>瀏覽器 Cookie：免費額度與付費解鎖狀態（HttpOnly）。</li>
          <li>付款資料由 Paddle 蒐集與處理；我們只接收交易編號以確認付款，不儲存完整信用卡號。</li>
          <li>代管於 Vercel 時，可能收到 IP 國家等連線資訊（例如用於顯示當地價格）。</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">2. 合約內容怎麼用</h2>
        <p className="mt-2">
          合約只在分析請求當下處理，用來產生風險標註與建議。我們不以你的合約作為對外販售資料，也不主動用合約內容訓練本服務或通用模型。分析過程可能將內容傳送至 OpenAI
          等處理器；第三方如何保存與處理該次請求，仍受其資料處理條款與本服務採用的 API 設定約束。
        </p>
        <p className="mt-2">
          我們不把合約內容做成可長期查閱的雲端資料庫。請注意：瀏覽器、網路傳輸與第三方處理器仍可能短暫接觸內容。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">3. Cookie</h2>
        <p className="mt-2">
          免費額度 Cookie 記錄本月是否已使用一次免費分析。付費 Cookie
          記錄此裝置已解鎖及其有效期間（單次解鎖於使用後清除；月繳約 31 天、年繳約 366 天）。這些 Cookie 為提供服務所必需，非廣告追蹤。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">4. 第三方</h2>
        <p className="mt-2">
          託管：Vercel。付款：Paddle。可選 AI 分析：OpenAI。他們依各自政策處理資料。你使用付款功能時，亦受 Paddle 隱私權政策拘束。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">5. 保存與權利</h2>
        <p className="mt-2">
          合約本文不作為本站可長期查閱的檔案保存。Cookie 於到期或你清除瀏覽器資料後失效。如需查詢、刪除與本服務相關之個人資料，
          {SUPPORT_EMAIL ? (
            <>
              請寄至{" "}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              。
            </>
          ) : (
            "付款相關資料請先透過 Paddle 收據中的客服連結提出。"
          )}
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">6. 未成年人</h2>
        <p className="mt-2">本服務面向接案工作使用，不針對兒童行銷。</p>
      </section>
    </LegalLayout>
  );
}
