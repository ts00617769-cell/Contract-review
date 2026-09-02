import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "退款政策｜契約哨兵",
  alternates: { canonical: "/refund" },
  openGraph: { url: "/refund" },
};

export default function RefundPage() {
  return (
    <LegalLayout title="退款政策" updated="2026-08-28">
      <p>
        契約哨兵販售的是數位分析結果與解鎖權限。付款由 Paddle 處理。以下為退款原則；若與 Paddle
        或當地強制法規衝突，以對消費者較有利者為準。
      </p>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">1. 數位商品</h2>
        <p className="mt-2">
          單次解鎖或訂閱一經確認付款、且本站已寫入解鎖狀態後，原則上不予退款。因為完整報告與修約建議屬於一經提供即消耗的數位內容。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">2. 可以申請退款的情況</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>重複扣款或明顯計費錯誤。</li>
          <li>付款成功但系統持續無法解鎖，且我們在合理時間內無法修復。</li>
          <li>依法必須提供之猶豫期或強制退款權利（若適用於你的所在地）。</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">3. 訂閱取消</h2>
        <p className="mt-2">
          專業版月繳與年繳為訂閱。取消後，通常不會立刻退還已過期間，但應停止下一期自動扣款。請使用
          Paddle 寄給你的管理連結或收據客服辦理。
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">4. 如何申請</h2>
        <p className="mt-2">
          請保留交易編號與 Paddle 收據，於付款後 14
          日內說明原因。
          {SUPPORT_EMAIL ? (
            <>
              請寄至{" "}
              <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              ；{" "}
            </>
          ) : (
            "請先透過 Paddle 收據中的客服連結提出；"
          )}
          核准之退款將依原付款方式退回，實際入帳時間依銀行與 Paddle 作業而定。
        </p>
      </section>
    </LegalLayout>
  );
}
