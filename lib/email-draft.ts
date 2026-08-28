export function buildEmail(findings: {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  riskDetail?: string;
  suggestedClause?: string;
}[], focusId?: string | null): string {
  const risks = findings
    .filter(
      (finding) =>
        (finding.severity === "high" || finding.severity === "medium") &&
        finding.riskDetail &&
        finding.suggestedClause,
    )
    .sort((a, b) => {
      if (a.id === focusId) return -1;
      if (b.id === focusId) return 1;
      return a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1;
    });

  if (risks.length === 0) {
    return `主旨：關於合作合約內容確認

您好：

謝謝您提供合約。為了讓後續合作與交付更順利，我想再確認付款、驗收及智慧財產權等執行細節，並建議將雙方共識補充於合約中。

若方便的話，希望能安排時間一起確認；謝謝您的理解與協助，期待順利展開合作。

敬祝 順心`;
  }

  const requests = risks
    .map(
      (finding, index) => `${index + 1}. ${finding.title}
調整原因：${finding.riskDetail}
建議文字：${finding.suggestedClause}`,
    )
    .join("\n\n");

  return `主旨：關於合作合約條款的幾點確認與調整建議

您好：

謝謝您提供合約，也很期待這次的合作。為了讓專案執行、驗收及後續權利使用都有清楚依據，我仔細確認後整理了幾點調整建議。這些內容主要是希望降低雙方認知落差，並不影響我方積極合作的意願：

${requests}

以上建議都是為了讓責任範圍、交付流程與權利義務更明確，避免日後因解讀不同影響專案進度。若貴方有既定版本或其他作法，我也很樂意一起討論並調整成雙方都能接受的文字。

再麻煩您協助確認，謝謝您的理解與配合，期待我們順利推進合作。

敬祝 順心`;
}
