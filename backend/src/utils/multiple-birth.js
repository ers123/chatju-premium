function getOrderLabel(order) {
  const labels = {
    1: '첫째',
    2: '둘째',
    3: '셋째',
    4: '넷째',
    5: '다섯째',
  };
  return labels[order] || `${order}번째`;
}

function getTotalLabel(total) {
  if (total === 2) return '쌍둥이';
  if (total === 3) return '세쌍둥이';
  if (total === 4) return '네쌍둥이';
  return `${total}명 다둥이`;
}

function buildMultipleBirthSection(multipleInfo) {
  if (!multipleInfo) return '';

  const order = Number(multipleInfo.order) || 1;
  const total = Math.max(Number(multipleInfo.total) || 2, 2);
  const orderLabel = getOrderLabel(order);
  const totalLabel = getTotalLabel(total);
  const sexContext = multipleInfo.sameSex === true
    ? '동성 다둥이입니다. 성별 조건이 같다면 사주 원국과 대운 방향 차이를 성별로 설명하지 말고, 양/음 표현, 출생 순서, 부모의 반응, 형제 간 역할 형성으로 구분하세요.'
    : multipleInfo.sameSex === false
      ? '성별이 다르면 사주 원국 자체는 같은 시간대에서 동일할 수 있어도 대운 방향, 사회적 역할 기대, 부모의 반응이 달라질 수 있습니다. 그래도 사주 원국 자체를 임의로 바꾸지 마세요.'
      : '성별 정보가 명확하지 않으므로 사주 원국 차이를 임의로 만들지 말고, 출생 순서와 관계 맥락 중심으로 구분하세요.';

  const rolePattern = order === 1
    ? '먼저 태어난 아이에게 흔한 패턴: 책임감 과부하, 먼저 양보해야 한다는 압박, 동생과의 비교 의식'
    : order === 2
      ? '나중에 태어난 아이에게 흔한 패턴: 더 자유로운 역할, 관심 경쟁, "나도 보여줄게"라는 자기 증명 욕구'
      : `${orderLabel}에게 흔한 패턴: 앞선 아이들과 비교되는 위치, 자기만의 역할을 찾으려는 욕구, 가족 안에서 고유한 자리 확보`;

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👶👶 다둥이/쌍둥이 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**이 아이는 ${totalLabel} 중 ${orderLabel}입니다.**
${multipleInfo.siblingName ? `**함께 태어난 형제/자매 이름:** ${multipleInfo.siblingName}` : ''}

**다둥이 해석 원칙 (반드시 준수):**
- 같은 사주를 가진 다둥이도 서로 다른 사람으로 자랍니다.
- 하지만 같은 사주를 서로 다른 사주처럼 꾸며내지 마세요.
- 사주 데이터(命)가 같다면 차이는 주로 표현 방식과 환경(運)에서 설명하세요.
- 핵심 구분축: 양/음 표현, 출생 순서, 부모의 반응, 형제 간 상호작용, 비교 경험, 각자 맡게 된 가족 내 역할.
- ${sexContext}
- ${rolePattern}

**리포트 작성 지침:**
- 이 아이가 같은 차트를 어떻게 다르게 표현하는지 설명하세요.
- 부모에게 "같은 날 태어났는데 왜 다르지?"라는 질문에 답하되, 결정론처럼 쓰지 마세요.
- 비교를 줄이고 각 아이를 다르게 대해야 하는 실제 대화법과 관찰 포인트를 제시하세요.
`;
}

module.exports = {
  buildMultipleBirthSection,
};
