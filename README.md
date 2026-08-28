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
| `NEXT_PUBLIC_PADDLE_ENV` | `production` 或 `sandbox` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle 前端 token |
| `PADDLE_API_KEY` | 伺服器查驗交易用 API key |
| `ACCESS_TOKEN_SECRET` | 至少 32 bytes 的隨機值，用於簽署付費權限 Cookie |
| `NEXT_PUBLIC_PADDLE_PRICE_ONETIME` | 單次解鎖 Price ID |
| `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTH` | 專業版月繳 Price ID |
| `NEXT_PUBLIC_PADDLE_PRICE_PRO_YEAR` | 專業版年繳 Price ID |
| `NEXT_PUBLIC_SITE_URL` | 正式站網址 |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | 客服與退款聯絡信箱 |

`ACCESS_TOKEN_SECRET` 可用以下指令產生：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paddle 後台的 Default payment link 與網站核准網域都應指向正式站。Overlay
Checkout 完成後，前端從 `checkout.completed` 事件取得交易編號並交給伺服器；
伺服器再向 Paddle API 查驗交易狀態與 Price ID，成功後才簽發付費權限 Cookie。
不要假設 Paddle 會替一般 `successUrl` 自動附加 `_ptxn`。

目前沒有登入帳號。單次解鎖只開一份報告；月繳約 31 天、年繳約 366 天，同一裝置可不限份數。取消訂閱請用 Paddle 收據連結。
