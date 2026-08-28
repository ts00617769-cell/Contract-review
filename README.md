# 契約哨兵

台灣接案設計師／行銷顧問合約 **AI 初審** MVP。上傳 PDF 後標註不對等條款、模糊付款與智財轉讓陷阱，並給出修改建議。

> **非正式法律意見。** 標註與建議僅供風險提示，不構成律師或法律事務所之正式法律服務。個案請洽詢合格律師。

## 技術

- Next.js App Router、TypeScript、Tailwind CSS
- PDF.js 預覽
- unpdf 抽文字
- OpenAI 結構化輸出（JSON Schema）
- 台灣接案規則庫；沒有 `OPENAI_API_KEY` 時自動 fallback

## 免費額度

同一瀏覽器（HttpOnly cookie）可免費審閱 **1 份** 合約，之後顯示升級文案。

## 本機執行

```bash
npm install
cp .env.example .env.local
# 可選：填入 OPENAI_API_KEY
npm run dev
```

開啟 http://localhost:3000

## 環境變數

| 變數 | 說明 |
| --- | --- |
| `OPENAI_API_KEY` | 選填。未設定則只用規則庫 |
| `OPENAI_MODEL` | 預設 `gpt-4o-mini` |
| `NEXT_PUBLIC_PADDLE_ENV` | 必填：`production` 或 `sandbox`。未設定會直接失敗 |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle Client-side Token（live_ / test_） |
| `PADDLE_API_KEY` | 伺服器確認付款用，不可加 `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_PADDLE_PRICE_ONETIME` | 單次解鎖 `pri_` ID（$2.99） |
| `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH` / `PRO_YEAR` | 專業版月繳、年繳 `pri_` ID。入門版免費 |
