import type { Language } from '../i18n/translations'

type LegalTable = {
  headers: string[]
  rows: string[][]
}

export type LegalSection = {
  title: string
  body?: string[]
  bullets?: string[]
  table?: LegalTable
}

export type LegalPageContent = {
  title: string
  effectiveDate: string
  updatedDate: string
  intro: string
  sections: LegalSection[]
}

type SupportedLegalLanguage = 'ko' | 'en' | 'ja' | 'zh' | 'vi' | 'id' | 'es' | 'pt' | 'fr' | 'th'

const privacyContent: Record<SupportedLegalLanguage, LegalPageContent> = {
  ko: {
    title: '개인정보처리방침',
    effectiveDate: '2026년 4월 29일',
    updatedDate: '2026년 6월 12일',
    intro: 'SoMyung은 부모가 아이의 기질을 이해할 수 있도록 돕는 사주 기반 분석 서비스입니다. 아래 내용은 서비스 이용 중 어떤 개인정보가 처리되는지, 왜 필요한지, 어떻게 보호되는지 설명합니다.',
    sections: [
      {
        title: '1. 처리하는 개인정보',
        table: {
          headers: ['구분', '항목', '목적', '보관'],
          rows: [
            ['무료 미리보기', '아이 이름, 생년월일, 출생시간, 성별, 출생지, 부모 역할/생년월일/출생시간', '기질 미리보기 생성', '데이터베이스에 저장하지 않음. 단, 서버/AI 처리 과정의 일시적 로그는 인프라 보관기간에 따름'],
            ['유료/프로모 리포트', '무료 입력 항목, 이메일, 생성된 사주 데이터, AI 리포트, PDF', '리포트 생성, 화면 표시, 이메일 전달, 고객지원', '리포트 접근과 재전송을 위해 제한 기간 보관. 삭제 요청 시 법령상 보관이 필요한 정보를 제외하고 삭제'],
            ['결제', '이메일, PayPal 주문/승인 정보, 결제 상태, 금액', '결제 처리, 환불, 거래 기록 보관', '전자상거래 및 세무 목적상 필요한 기간 보관'],
            ['분석 쿠키', 'Google Analytics 쿠키/식별자', '서비스 개선 분석', '동의한 경우에만 사용. 브라우저에서 동의 철회 가능'],
          ],
        },
      },
      {
        title: '2. 처리의 법적 근거 (GDPR 제6조)',
        body: ['EU/영국 GDPR이 적용되는 경우, 다음 법적 근거에 따라 개인정보를 처리합니다:'],
        bullets: [
          '무료 미리보기: 이용자의 동의 (제6조 1항 (a)). 동의는 언제든지 철회할 수 있습니다.',
          '유료/프로모 리포트: 계약의 이행 (제6조 1항 (b)).',
          '결제 및 거래 기록: 법적 의무 준수 (제6조 1항 (c)) 및 계약의 이행 (제6조 1항 (b)).',
          '분석 쿠키: 쿠키 배너를 통한 이용자의 동의 (제6조 1항 (a)).',
        ],
      },
      {
        title: '3. 아동 정보와 보호자 확인',
        body: [
          '이 서비스는 아이 본인이 직접 사용하는 서비스가 아니라, 부모 또는 법정대리인이 아이를 이해하기 위해 사용하는 보호자 대상 서비스입니다. 만 14세 미만 아동의 정보는 부모 또는 법정대리인만 입력할 수 있습니다.',
          '본 서비스는 부모 또는 법정대리인이 아이를 대신하여 사용하도록 설계되었습니다. 당사는 만 13세 미만 아동으로부터 직접 개인정보를 고의로 수집하지 않습니다. 만 13세 미만 아동이 직접 정보를 제공했다고 판단되시면 support@somyung.cc로 연락해주세요. 확인 즉시 삭제하겠습니다 (COPPA).',
        ],
      },
      {
        title: '4. 해외 이전 및 처리업체',
        body: [
          '서비스 제공을 위해 아래 업체가 데이터를 처리할 수 있습니다. 생년월일, 출생시간, 성별, 출생지처럼 단독으로는 이름이 없어도 특정 개인과 연결될 수 있는 정보는 개인정보로 취급합니다.',
          'EEA(유럽경제지역), 영국 또는 대한민국 외 지역에서 개인정보가 처리되는 경우, 유럽연합 집행위원회가 승인한 표준계약조항(SCC) 또는 이에 상응하는 법적 안전장치에 따라 이전됩니다.',
        ],
        table: {
          headers: ['업체', '국가/지역', '처리 항목', '목적'],
          rows: [
            ['Supabase', '미국/글로벌', '계정, 리포트, 결제 관련 DB 데이터', '데이터베이스 및 인증'],
            ['AWS', '대한민국/글로벌', 'API 요청 및 서버 처리 데이터', '백엔드 실행 및 로그'],
            ['Cloudflare', '글로벌', '웹 요청, 캐시, 보안 로그', '웹사이트 호스팅 및 보안'],
            ['OpenAI 또는 Google Gemini', '미국/글로벌', '사주 계산 결과와 분석에 필요한 최소 입력 데이터', 'AI 리포트 생성'],
            ['PayPal', '글로벌', '결제자 정보, 주문, 승인, 결제 상태', '결제 처리'],
            ['Resend', '미국/글로벌', '이메일 주소, 리포트 이메일 내용/PDF', '리포트 이메일 발송'],
            ['Google Analytics', '글로벌', '쿠키, 기기/이용 이벤트', '동의 기반 분석'],
          ],
        },
      },
      {
        title: '5. 보관 기간',
        bullets: [
          '무료 미리보기 입력 정보: 데이터베이스에 저장하지 않습니다.',
          '결제 및 거래 기록: 「전자상거래 등에서의 소비자보호에 관한 법률」 및 세법에 따라 5년간 보관합니다.',
          '유료 리포트 기록(입력 정보, 생성된 사주 데이터, 리포트, PDF): 삭제 요청 시까지 보관하며, 최대 마지막 접근 후 24개월(기본 운영 기간이며 변경될 수 있음)이 지나면 삭제 또는 익명화합니다.',
        ],
      },
      {
        title: '6. 보안 조치',
        bullets: ['리포트와 PDF 접근에는 서버가 발급한 제한 시간 토큰을 사용합니다.', '결제 승인에는 PayPal 주문 ID와 서버 발급 결제 토큰을 함께 확인합니다.', '분석 쿠키는 동의한 경우에만 로드됩니다.', '고객지원 로그에서는 가능한 한 이메일을 마스킹합니다.'],
      },
      {
        title: '7. 이용자의 권리',
        body: ['개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다. 요청은 support@somyung.cc로 보내주세요. 법령상 보관이 필요한 결제/거래 기록은 삭제 대신 분리 보관 또는 최소화될 수 있습니다.'],
        bullets: [
          '데이터 이동권 (GDPR 제20조): 이용자가 제공한 데이터를 구조화되고 일반적으로 사용되며 기계 판독이 가능한 형식으로 받아볼 것을 요청할 수 있습니다.',
          '자동화된 의사결정 (GDPR 제22조): 리포트는 입력하신 출생 정보를 바탕으로 AI가 자동 생성하는 프로파일링 결과입니다. 이는 정보 제공, 자기 성찰, 엔터테인먼트 목적으로만 제공되며, 법적 효력이나 이에 준하는 중대한 영향을 미치지 않고, 이용자나 아이에 대한 어떠한 결정에도 사용되지 않습니다. 이 처리에 이의를 제기하거나 사람의 검토를 원하시면 support@somyung.cc로 연락해주세요.',
        ],
      },
      {
        title: '8. 캘리포니아 거주자의 권리 (CCPA/CPRA)',
        body: ['당사는 캘리포니아 소비자 개인정보 보호법(CCPA)에서 정의하는 개인정보의 판매 또는 공유를 하지 않습니다. "내 개인정보를 판매하거나 공유하지 마세요(Do Not Sell or Share My Personal Information)": 당사는 개인정보를 판매하지 않습니다. 캘리포니아 거주자는 support@somyung.cc로 연락하여 알 권리, 삭제권, 정정권, 차별받지 않을 권리를 행사할 수 있습니다.'],
      },
      {
        title: '9. 개인정보보호책임자 및 문의',
        body: [
          '개인정보보호책임자(CPO): 이요한 (privacy@somyung.cc)',
          '개인정보 관련 문의: support@somyung.cc',
          '사업자: 하모니온 / 대표: 이요한',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    effectiveDate: 'April 29, 2026',
    updatedDate: 'June 12, 2026',
    intro: 'SoMyung helps parents understand a child’s temperament through Saju-based analysis. This notice explains what personal data is processed, why it is needed, and how it is protected.',
    sections: [
      {
        title: '1. Personal Data We Process',
        table: {
          headers: ['Context', 'Data', 'Purpose', 'Retention'],
          rows: [
            ['Free preview', 'Child nickname or name, birth date/time, gender, birth place, optional parent role and parent birth date/time', 'Generate a temperament preview', 'Not stored in the database. Temporary infrastructure/API logs may be retained by service providers'],
            ['Paid or promo report', 'Preview inputs, email, generated Saju data, AI report, PDF', 'Generate, display, deliver, and support the report', 'Kept for limited report access and support. Deleted on request except records legally required to retain'],
            ['Payment', 'Email, PayPal order/approval data, payment status, amount', 'Payment processing, refunds, transaction record keeping', 'Retained as required for commerce, tax, dispute, and audit purposes'],
            ['Analytics cookies', 'Google Analytics cookies/identifiers', 'Service improvement analytics', 'Used only after consent. You can reset consent in the footer'],
          ],
        },
      },
      {
        title: '2. Lawful Bases for Processing (GDPR Art. 6)',
        body: ['Where the EU/UK GDPR applies, we rely on the following lawful bases:'],
        bullets: [
          'Free preview: your consent (Art. 6(1)(a)). You may withdraw consent at any time.',
          'Paid or promo report: performance of a contract with you (Art. 6(1)(b)).',
          'Payment and transaction records: compliance with legal obligations (Art. 6(1)(c)) and performance of a contract (Art. 6(1)(b)).',
          'Analytics cookies: your consent (Art. 6(1)(a)), collected through the cookie banner.',
        ],
      },
      {
        title: '3. Children’s Data and Guardian Role',
        body: [
          'This service is directed to parents and guardians, not to children acting on their own. Data about a child must be entered only by a parent or legal guardian who has authority to do so.',
          'This service is designed for parents and legal guardians to use on behalf of their children. We do not knowingly collect personal information directly from children under 13. If you believe a child under 13 has provided data directly to us, contact support@somyung.cc and we will delete it promptly (COPPA).',
        ],
      },
      {
        title: '4. International Processing and Providers',
        body: [
          'We treat birth date, birth time, gender, birth place, and generated reports as personal data when they relate to a child or family, even if a direct legal name is not sent to every provider.',
          'Where personal data is processed outside the EEA, the United Kingdom, or Korea, it is transferred under Standard Contractual Clauses (SCC) approved by the European Commission or equivalent legal safeguards.',
        ],
        table: {
          headers: ['Provider', 'Region', 'Data', 'Purpose'],
          rows: [
            ['Supabase', 'US/global', 'Account, report, payment-related database data', 'Database and authentication'],
            ['AWS', 'Korea/global', 'API request and server processing data', 'Backend execution and logs'],
            ['Cloudflare', 'Global', 'Web requests, cache, security logs', 'Website hosting and security'],
            ['OpenAI or Google Gemini', 'US/global', 'Saju calculation output and minimum input data needed for analysis', 'AI report generation'],
            ['PayPal', 'Global', 'Payer, order, authorization, and payment status data', 'Payment processing'],
            ['Resend', 'US/global', 'Email address, report email content/PDF', 'Report email delivery'],
            ['Google Analytics', 'Global', 'Cookies, device and usage events', 'Consent-based analytics'],
          ],
        },
      },
      {
        title: '5. Retention Periods',
        bullets: [
          'Free preview inputs: not stored in our database.',
          'Payment and transaction records: retained for 5 years under the Korean Act on Consumer Protection in Electronic Commerce and applicable tax laws.',
          'Paid reading records (inputs, generated Saju data, report, PDF): retained until you request deletion, or at most 24 months after your last access (default operational period; may be adjusted), after which they are deleted or anonymized.',
        ],
      },
      {
        title: '6. Security Measures',
        bullets: ['Reports and PDFs require a server-issued time-limited token.', 'Payment capture requires both the PayPal order ID and a server-issued payment token.', 'Analytics scripts load only after cookie consent.', 'Support logs minimize directly identifying data where practical.'],
      },
      {
        title: '7. Your Rights',
        body: ['You may request access, correction, deletion, restriction, or withdrawal of consent by emailing support@somyung.cc. Some payment or transaction records may need to be retained for legal, tax, audit, refund, or dispute purposes.'],
        bullets: [
          'Data portability (GDPR Art. 20): you may request a copy of the data you provided in a structured, commonly used, machine-readable format.',
          'Automated decision-making (GDPR Art. 22): reports are generated automatically by AI based on the birth information you provide. This is AI-generated profiling offered for informational, self-reflection, and entertainment purposes only; it produces no legal or similarly significant effects, is not used to make decisions about you or your child, and you may object to this processing or request a human review at support@somyung.cc.',
        ],
      },
      {
        title: '8. California Privacy Rights (CCPA/CPRA)',
        body: ['We do not sell or share personal information as defined by the California Consumer Privacy Act. "Do Not Sell or Share My Personal Information": we do not sell; California residents may contact support@somyung.cc to exercise their rights to know, delete, correct, and not be discriminated against.'],
      },
      {
        title: '9. Privacy Officer and Contact',
        body: [
          'Chief Privacy Officer (CPO, 개인정보보호책임자): Yohan Lee (privacy@somyung.cc)',
          'Privacy contact: support@somyung.cc',
          'Operator: HarmonyOn / Representative: Yohan Lee',
        ],
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年6月12日',
    intro: 'SoMyungは、保護者がお子様の気質を理解するためのSaju分析サービスです。本ポリシーは、処理される個人データ、目的、保護方法を説明します。',
    sections: [
      { title: '1. 取り扱う個人データ', table: { headers: ['場面', 'データ', '目的', '保管'], rows: [['無料プレビュー', 'お子様のニックネームまたは名前、生年月日、出生時刻、性別、出生地、任意の保護者の役割・生年月日・出生時刻', '気質プレビューの生成', 'データベースには保存しません。ただしインフラ/APIログは一時的に残る場合があります'], ['有料/プロモレポート', '入力情報、メール、生成されたSajuデータ、AIレポート、PDF', 'レポート生成、表示、送付、サポート', '限定的なアクセスとサポートのため保管。削除依頼時は法令上必要な記録を除き削除'], ['決済', 'メール、PayPal注文/承認情報、決済状態、金額', '決済、返金、取引記録', '商取引・税務・紛争対応に必要な期間'], ['分析Cookie', 'Google Analytics Cookie/識別子', 'サービス改善分析', '同意した場合のみ使用']] } },
      { title: '2. 処理の法的根拠（GDPR第6条）', body: ['EU/英国GDPRが適用される場合、以下の法的根拠に基づき個人データを処理します:'], bullets: ['無料プレビュー: ご本人の同意（第6条1項(a)）。同意はいつでも撤回できます。', '有料/プロモレポート: 契約の履行（第6条1項(b)）。', '決済・取引記録: 法的義務の遵守（第6条1項(c)）および契約の履行（第6条1項(b)）。', '分析Cookie: Cookieバナーによる同意（第6条1項(a)）。'] },
      { title: '3. お子様の情報と保護者確認', body: ['本サービスはお子様本人ではなく、保護者向けのサービスです。お子様の情報は、入力権限を持つ親または法定代理人のみが入力できます。', '本サービスは、保護者がお子様に代わって利用するよう設計されています。13歳未満の児童から直接個人情報を故意に収集することはありません。13歳未満の児童が直接情報を提供したと思われる場合は、support@somyung.cc までご連絡ください。速やかに削除します（COPPA）。'] },
      { title: '4. 国外処理と委託先', body: ['生年月日、出生時刻、性別、出生地、生成レポートは、氏名がなくても家族に結び付く場合は個人データとして扱います。', 'EEA、英国、または韓国以外で個人データが処理される場合、欧州委員会が承認した標準契約条項（SCC）または同等の法的保護措置に基づき移転されます。'], table: { headers: ['委託先', '地域', 'データ', '目的'], rows: [['Supabase', '米国/グローバル', 'アカウント、レポート、決済関連DBデータ', 'DBと認証'], ['AWS', '韓国/グローバル', 'APIリクエスト、サーバー処理データ', 'バックエンド実行とログ'], ['Cloudflare', 'グローバル', 'Webリクエスト、キャッシュ、セキュリティログ', 'ホスティングと保護'], ['OpenAIまたはGoogle Gemini', '米国/グローバル', '分析に必要な最小限のSajuデータ', 'AIレポート生成'], ['PayPal', 'グローバル', '支払者、注文、承認、決済状態', '決済処理'], ['Resend', '米国/グローバル', 'メールアドレス、レポートメール/PDF', 'メール送信'], ['Google Analytics', 'グローバル', 'Cookie、端末、利用イベント', '同意に基づく分析']] } },
      { title: '5. 保管期間', bullets: ['無料プレビューの入力情報: データベースに保存しません。', '決済・取引記録: 韓国の電子商取引消費者保護法および税法に基づき5年間保管します。', '有料レポート記録（入力情報、生成されたSajuデータ、レポート、PDF）: 削除依頼まで、または最終アクセスから最大24か月（基本運用期間であり変更される場合があります）保管し、その後削除または匿名化します。'] },
      { title: '6. セキュリティ', bullets: ['レポートとPDFには期限付きサーバートークンが必要です。', '決済確定にはPayPal注文IDとサーバー発行トークンを確認します。', '分析スクリプトはCookie同意後のみ読み込まれます。'] },
      { title: '7. 権利行使', body: ['開示、訂正、削除、処理停止、同意撤回は support@somyung.cc へご連絡ください。法令上必要な決済記録は保持される場合があります。'], bullets: ['データポータビリティ（GDPR第20条）: ご提供いただいたデータを構造化され、一般的に利用され、機械可読な形式で受け取ることを請求できます。', '自動化された意思決定（GDPR第22条）: レポートは入力された出生情報に基づきAIが自動生成するプロファイリングです。情報提供、自己省察、エンターテインメント目的でのみ提供され、法的効果やそれに準ずる重大な影響はなく、お客様やお子様に関する決定には使用されません。この処理への異議申立てや人による確認を希望される場合は support@somyung.cc までご連絡ください。'] },
      { title: '8. カリフォルニア州居住者の権利（CCPA/CPRA）', body: ['当社はカリフォルニア州消費者プライバシー法（CCPA）に定義される個人情報の販売・共有を行いません。「私の個人情報を販売または共有しないでください」: 当社は販売を行いません。カリフォルニア州居住者は support@somyung.cc に連絡して、知る権利、削除権、訂正権、差別を受けない権利を行使できます。'] },
      { title: '9. 個人情報保護責任者・連絡先', body: ['個人情報保護責任者（CPO）: Yohan Lee (privacy@somyung.cc)', 'プライバシー窓口: support@somyung.cc', '運営者: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  zh: {
    title: '隐私政策',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年6月12日',
    intro: 'SoMyung 是面向父母/监护人的四柱气质分析服务。本政策说明我们处理哪些个人信息、处理目的以及保护措施。',
    sections: [
      { title: '1. 我们处理的信息', table: { headers: ['场景', '信息', '目的', '保存'], rows: [['免费预览', '孩子姓名、出生日期/时间、性别、出生地、父母角色及父母出生信息', '生成气质预览', '不保存到数据库；基础设施/API日志可能短期保留'], ['付费或优惠报告', '预览输入、邮箱、生成的四柱数据、AI报告、PDF', '生成、展示、发送和支持报告', '为访问和支持进行有限保存；删除请求后依法必须保留的信息除外'], ['支付', '邮箱、PayPal订单/授权数据、支付状态、金额', '支付、退款、交易记录', '按商业、税务、争议和审计需要保存'], ['分析Cookie', 'Google Analytics Cookie/标识符', '服务改进分析', '仅在同意后使用']] } },
      { title: '2. 处理的法律依据（GDPR 第6条）', body: ['在适用欧盟/英国 GDPR 的情况下，我们基于以下法律依据处理个人信息:'], bullets: ['免费预览：您的同意（第6(1)(a)条）。您可以随时撤回同意。', '付费/优惠报告：履行合同（第6(1)(b)条）。', '支付与交易记录：遵守法律义务（第6(1)(c)条）及履行合同（第6(1)(b)条）。', '分析Cookie：通过Cookie横幅获得的同意（第6(1)(a)条）。'] },
      { title: '3. 儿童信息与监护人', body: ['本服务面向父母或法定监护人，不面向儿童独立使用。儿童信息只能由有权输入的父母或法定监护人提交。', '本服务设计供父母或法定监护人代表孩子使用。我们不会故意直接向13岁以下儿童收集个人信息。如您认为13岁以下儿童直接提供了信息，请联系 support@somyung.cc，我们将立即删除（COPPA）。'] },
      { title: '4. 跨境处理与服务商', body: ['出生日期、出生时间、性别、出生地和生成报告在与孩子或家庭相关时均按个人信息处理。', '在欧洲经济区（EEA）、英国或韩国以外处理个人信息时，将依据欧盟委员会批准的标准合同条款（SCC）或同等法律保障措施进行传输。'], table: { headers: ['服务商', '地区', '信息', '目的'], rows: [['Supabase', '美国/全球', '账户、报告、支付相关数据库信息', '数据库和认证'], ['AWS', '韩国/全球', 'API请求和服务器处理数据', '后端运行和日志'], ['Cloudflare', '全球', '网页请求、缓存、安全日志', '网站托管和安全'], ['OpenAI 或 Google Gemini', '美国/全球', '分析所需的最少四柱数据', 'AI报告生成'], ['PayPal', '全球', '付款人、订单、授权、支付状态', '支付处理'], ['Resend', '美国/全球', '邮箱、报告邮件/PDF', '邮件发送'], ['Google Analytics', '全球', 'Cookie、设备和使用事件', '基于同意的分析']] } },
      { title: '5. 保存期限', bullets: ['免费预览输入信息：不保存到数据库。', '支付与交易记录：依据韩国《电子商务消费者保护法》及税法保存5年。', '付费报告记录（输入信息、生成的四柱数据、报告、PDF）：保存至您请求删除，或最长在最后访问后24个月（默认运营期限，可能调整）后删除或匿名化。'] },
      { title: '6. 安全措施', bullets: ['报告和PDF需要服务器签发的限时令牌。', '支付确认需要PayPal订单ID和服务器签发的支付令牌。', '分析脚本仅在Cookie同意后加载。'] },
      { title: '7. 您的权利', body: ['您可以通过 support@somyung.cc 请求访问、更正、删除、限制处理或撤回同意。依法必须保存的支付/交易记录可能无法立即删除。'], bullets: ['数据可携权（GDPR 第20条）：您可以要求以结构化、通用、机器可读的格式获取您提供的数据。', '自动化决策（GDPR 第22条）：报告由AI根据您输入的出生信息自动生成，属于AI生成的画像分析，仅用于信息参考、自我反思和娱乐目的，不产生法律效力或类似重大影响，也不用于对您或孩子做出任何决定。如需对该处理提出异议或要求人工审查，请联系 support@somyung.cc。'] },
      { title: '8. 加州居民权利（CCPA/CPRA）', body: ['我们不出售或共享《加州消费者隐私法》定义的个人信息。"请勿出售或共享我的个人信息"：我们不出售个人信息。加州居民可联系 support@somyung.cc 行使知情权、删除权、更正权及不受歧视的权利。'] },
      { title: '9. 个人信息保护负责人与联系方式', body: ['个人信息保护负责人（CPO）: Yohan Lee (privacy@somyung.cc)', '隐私联系邮箱: support@somyung.cc', '运营方: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  vi: {
    title: 'Chính sách quyền riêng tư',
    effectiveDate: '29/04/2026',
    updatedDate: '12/06/2026',
    intro: 'SoMyung là dịch vụ phân tích Saju dành cho cha mẹ/người giám hộ để hiểu khí chất của trẻ. Chính sách này giải thích dữ liệu cá nhân được xử lý, mục đích và cách bảo vệ.',
    sections: [
      { title: '1. Dữ liệu chúng tôi xử lý', table: { headers: ['Ngữ cảnh', 'Dữ liệu', 'Mục đích', 'Lưu giữ'], rows: [['Bản xem trước miễn phí', 'Tên trẻ, ngày/giờ sinh, giới tính, nơi sinh, vai trò và thông tin sinh của phụ huynh', 'Tạo bản xem trước khí chất', 'Không lưu trong cơ sở dữ liệu; nhật ký hạ tầng/API có thể được giữ tạm thời'], ['Báo cáo trả phí/khuyến mãi', 'Dữ liệu nhập, email, dữ liệu Saju đã tạo, báo cáo AI, PDF', 'Tạo, hiển thị, gửi và hỗ trợ báo cáo', 'Lưu trong thời gian giới hạn để truy cập/hỗ trợ; xóa theo yêu cầu trừ hồ sơ phải giữ theo luật'], ['Thanh toán', 'Email, đơn hàng/ủy quyền PayPal, trạng thái, số tiền', 'Xử lý thanh toán, hoàn tiền, lưu hồ sơ giao dịch', 'Lưu theo yêu cầu thương mại, thuế, tranh chấp và kiểm toán'], ['Cookie phân tích', 'Cookie/định danh Google Analytics', 'Phân tích cải thiện dịch vụ', 'Chỉ dùng khi có đồng ý']] } },
      { title: '2. Cơ sở pháp lý xử lý (Điều 6 GDPR)', body: ['Khi GDPR của EU/Anh áp dụng, chúng tôi xử lý dữ liệu cá nhân dựa trên các cơ sở pháp lý sau:'], bullets: ['Bản xem trước miễn phí: sự đồng ý của bạn (Điều 6(1)(a)). Bạn có thể rút lại đồng ý bất cứ lúc nào.', 'Báo cáo trả phí/khuyến mãi: thực hiện hợp đồng (Điều 6(1)(b)).', 'Hồ sơ thanh toán và giao dịch: tuân thủ nghĩa vụ pháp lý (Điều 6(1)(c)) và thực hiện hợp đồng (Điều 6(1)(b)).', 'Cookie phân tích: sự đồng ý qua banner cookie (Điều 6(1)(a)).'] },
      { title: '2. Dữ liệu trẻ em và người giám hộ'.replace('2.', '3.'), body: ['Dịch vụ này dành cho cha mẹ/người giám hộ, không dành cho trẻ tự sử dụng. Thông tin của trẻ chỉ nên được nhập bởi cha mẹ hoặc người giám hộ hợp pháp có thẩm quyền.', 'Dịch vụ này được thiết kế để cha mẹ/người giám hộ hợp pháp sử dụng thay mặt con của họ. Chúng tôi không cố ý thu thập thông tin cá nhân trực tiếp từ trẻ dưới 13 tuổi. Nếu bạn cho rằng trẻ dưới 13 tuổi đã trực tiếp cung cấp dữ liệu, hãy liên hệ support@somyung.cc để chúng tôi xóa ngay (COPPA).'] },
      { title: '4. Xử lý quốc tế và nhà cung cấp', body: ['Ngày sinh, giờ sinh, giới tính, nơi sinh và báo cáo tạo ra được xem là dữ liệu cá nhân khi liên quan đến trẻ hoặc gia đình.', 'Khi dữ liệu cá nhân được xử lý ngoài EEA, Vương quốc Anh hoặc Hàn Quốc, dữ liệu được chuyển giao theo Điều khoản Hợp đồng Chuẩn (SCC) do Ủy ban Châu Âu phê duyệt hoặc các biện pháp bảo vệ pháp lý tương đương.'], table: { headers: ['Nhà cung cấp', 'Khu vực', 'Dữ liệu', 'Mục đích'], rows: [['Supabase', 'Mỹ/toàn cầu', 'Tài khoản, báo cáo, dữ liệu DB liên quan thanh toán', 'Cơ sở dữ liệu và xác thực'], ['AWS', 'Hàn Quốc/toàn cầu', 'Yêu cầu API và dữ liệu xử lý máy chủ', 'Chạy backend và nhật ký'], ['Cloudflare', 'Toàn cầu', 'Yêu cầu web, cache, nhật ký bảo mật', 'Lưu trữ web và bảo mật'], ['OpenAI hoặc Google Gemini', 'Mỹ/toàn cầu', 'Dữ liệu Saju tối thiểu cần cho phân tích', 'Tạo báo cáo AI'], ['PayPal', 'Toàn cầu', 'Người thanh toán, đơn hàng, ủy quyền, trạng thái', 'Xử lý thanh toán'], ['Resend', 'Mỹ/toàn cầu', 'Email, nội dung email/PDF báo cáo', 'Gửi email'], ['Google Analytics', 'Toàn cầu', 'Cookie, thiết bị, sự kiện sử dụng', 'Phân tích dựa trên đồng ý']] } },
      { title: '5. Thời hạn lưu giữ', bullets: ['Dữ liệu bản xem trước miễn phí: không lưu trong cơ sở dữ liệu.', 'Hồ sơ thanh toán và giao dịch: lưu 5 năm theo Luật bảo vệ người tiêu dùng trong thương mại điện tử của Hàn Quốc và luật thuế.', 'Hồ sơ báo cáo trả phí (dữ liệu nhập, dữ liệu Saju đã tạo, báo cáo, PDF): lưu đến khi bạn yêu cầu xóa, hoặc tối đa 24 tháng sau lần truy cập cuối (thời hạn mặc định, có thể điều chỉnh), sau đó sẽ bị xóa hoặc ẩn danh hóa.'] },
      { title: '6. Bảo mật', bullets: ['Báo cáo và PDF cần token có thời hạn do máy chủ cấp.', 'Xác nhận thanh toán cần PayPal order ID và token thanh toán do máy chủ cấp.', 'Script phân tích chỉ tải sau khi đồng ý cookie.'] },
      { title: '7. Quyền của bạn', body: ['Bạn có thể yêu cầu truy cập, sửa, xóa, hạn chế xử lý hoặc rút đồng ý qua support@somyung.cc. Một số hồ sơ thanh toán/giao dịch có thể phải được giữ theo luật.'], bullets: ['Quyền di chuyển dữ liệu (Điều 20 GDPR): bạn có thể yêu cầu bản sao dữ liệu bạn cung cấp ở định dạng có cấu trúc, thông dụng và máy đọc được.', 'Quyết định tự động (Điều 22 GDPR): báo cáo được AI tạo tự động dựa trên thông tin sinh bạn cung cấp. Đây là hồ sơ phân tích do AI tạo, chỉ phục vụ mục đích tham khảo, tự suy ngẫm và giải trí; không có hiệu lực pháp lý hay ảnh hưởng trọng yếu tương tự và không được dùng để đưa ra quyết định về bạn hoặc con bạn. Bạn có thể phản đối việc xử lý này hoặc yêu cầu con người xem xét qua support@somyung.cc.'] },
      { title: '8. Quyền của cư dân California (CCPA/CPRA)', body: ['Chúng tôi không bán hoặc chia sẻ thông tin cá nhân theo định nghĩa của Đạo luật Quyền riêng tư Người tiêu dùng California. "Không bán hoặc chia sẻ thông tin cá nhân của tôi": chúng tôi không bán. Cư dân California có thể liên hệ support@somyung.cc để thực hiện quyền được biết, xóa, sửa và không bị phân biệt đối xử.'] },
      { title: '9. Cán bộ bảo vệ dữ liệu và liên hệ', body: ['Cán bộ bảo vệ thông tin cá nhân (CPO): Yohan Lee (privacy@somyung.cc)', 'Liên hệ quyền riêng tư: support@somyung.cc', 'Đơn vị vận hành: HarmonyOn / Đại diện: Yohan Lee'] },
    ],
  },
  id: {
    title: 'Kebijakan Privasi',
    effectiveDate: '29 April 2026',
    updatedDate: '12 Juni 2026',
    intro: 'SoMyung adalah layanan analisis Saju untuk membantu orang tua atau wali memahami temperamen anak. Kebijakan ini menjelaskan data pribadi yang diproses, tujuannya, dan cara perlindungannya.',
    sections: [
      { title: '1. Data yang Kami Proses', table: { headers: ['Konteks', 'Data', 'Tujuan', 'Retensi'], rows: [['Pratinjau gratis', 'Nama anak, tanggal/jam lahir, gender, tempat lahir, peran orang tua dan data lahir orang tua', 'Membuat pratinjau temperamen', 'Tidak disimpan di database. Log infrastruktur/API sementara dapat tersimpan'], ['Laporan berbayar atau promo', 'Input pratinjau, email, data Saju yang dibuat, laporan AI, PDF', 'Membuat, menampilkan, mengirim, dan mendukung laporan', 'Disimpan terbatas untuk akses dan dukungan. Dihapus atas permintaan kecuali catatan yang wajib disimpan hukum'], ['Pembayaran', 'Email, data pesanan/persetujuan PayPal, status pembayaran, jumlah', 'Pemrosesan pembayaran, refund, pencatatan transaksi', 'Disimpan sesuai kebutuhan perdagangan, pajak, sengketa, dan audit'], ['Cookie analitik', 'Cookie/identifier Google Analytics', 'Analitik peningkatan layanan', 'Hanya digunakan setelah persetujuan']] } },
      { title: '2. Dasar Hukum Pemrosesan (Pasal 6 GDPR)', body: ['Jika GDPR UE/Inggris berlaku, kami memproses data pribadi berdasarkan dasar hukum berikut:'], bullets: ['Pratinjau gratis: persetujuan Anda (Pasal 6(1)(a)). Anda dapat menarik persetujuan kapan saja.', 'Laporan berbayar/promo: pelaksanaan kontrak (Pasal 6(1)(b)).', 'Catatan pembayaran dan transaksi: kepatuhan terhadap kewajiban hukum (Pasal 6(1)(c)) dan pelaksanaan kontrak (Pasal 6(1)(b)).', 'Cookie analitik: persetujuan Anda melalui banner cookie (Pasal 6(1)(a)).'] },
      { title: '3. Data Anak dan Peran Wali', body: ['Layanan ini ditujukan untuk orang tua atau wali, bukan untuk digunakan langsung oleh anak. Data anak hanya boleh dimasukkan oleh orang tua atau wali sah yang berwenang.', 'Layanan ini dirancang untuk digunakan oleh orang tua/wali sah atas nama anak mereka. Kami tidak dengan sengaja mengumpulkan informasi pribadi langsung dari anak di bawah 13 tahun. Jika Anda yakin anak di bawah 13 tahun telah memberikan data secara langsung, hubungi support@somyung.cc agar kami segera menghapusnya (COPPA).'] },
      { title: '4. Pemrosesan Internasional dan Penyedia', body: ['Tanggal lahir, jam lahir, gender, tempat lahir, dan laporan yang dibuat diperlakukan sebagai data pribadi ketika terkait dengan anak atau keluarga.', 'Jika data pribadi diproses di luar EEA, Inggris, atau Korea, data ditransfer berdasarkan Klausul Kontrak Standar (SCC) yang disetujui Komisi Eropa atau perlindungan hukum yang setara.'], table: { headers: ['Penyedia', 'Wilayah', 'Data', 'Tujuan'], rows: [['Supabase', 'AS/global', 'Akun, laporan, data database terkait pembayaran', 'Database dan autentikasi'], ['AWS', 'Korea/global', 'Permintaan API dan data pemrosesan server', 'Eksekusi backend dan log'], ['Cloudflare', 'Global', 'Permintaan web, cache, log keamanan', 'Hosting dan keamanan situs'], ['OpenAI atau Google Gemini', 'AS/global', 'Data Saju minimum yang diperlukan untuk analisis', 'Pembuatan laporan AI'], ['PayPal', 'Global', 'Pembayar, pesanan, otorisasi, status pembayaran', 'Pemrosesan pembayaran'], ['Resend', 'AS/global', 'Email, konten email/PDF laporan', 'Pengiriman email'], ['Google Analytics', 'Global', 'Cookie, perangkat, event penggunaan', 'Analitik berbasis persetujuan']] } },
      { title: '5. Masa Retensi', bullets: ['Input pratinjau gratis: tidak disimpan di database.', 'Catatan pembayaran dan transaksi: disimpan 5 tahun sesuai Undang-Undang Perlindungan Konsumen dalam Perdagangan Elektronik Korea dan hukum pajak.', 'Catatan laporan berbayar (input, data Saju yang dihasilkan, laporan, PDF): disimpan sampai Anda meminta penghapusan, atau maksimal 24 bulan setelah akses terakhir (masa default, dapat disesuaikan), lalu dihapus atau dianonimkan.'] },
      { title: '6. Keamanan', bullets: ['Laporan dan PDF memerlukan token terbatas waktu dari server.', 'Konfirmasi pembayaran memerlukan PayPal order ID dan token pembayaran dari server.', 'Script analitik hanya dimuat setelah persetujuan cookie.'] },
      { title: '7. Hak Anda', body: ['Anda dapat meminta akses, koreksi, penghapusan, pembatasan pemrosesan, atau penarikan persetujuan melalui support@somyung.cc. Sebagian catatan pembayaran/transaksi mungkin wajib disimpan oleh hukum.'], bullets: ['Portabilitas data (Pasal 20 GDPR): Anda dapat meminta salinan data yang Anda berikan dalam format terstruktur, umum digunakan, dan dapat dibaca mesin.', 'Pengambilan keputusan otomatis (Pasal 22 GDPR): laporan dibuat secara otomatis oleh AI berdasarkan informasi kelahiran yang Anda berikan. Ini adalah profil yang dihasilkan AI untuk tujuan informasi, refleksi diri, dan hiburan saja; tidak menimbulkan akibat hukum atau dampak signifikan serupa dan tidak digunakan untuk membuat keputusan tentang Anda atau anak Anda. Anda dapat menolak pemrosesan ini atau meminta peninjauan oleh manusia melalui support@somyung.cc.'] },
      { title: '8. Hak Penduduk California (CCPA/CPRA)', body: ['Kami tidak menjual atau membagikan informasi pribadi sebagaimana didefinisikan oleh California Consumer Privacy Act. "Jangan Jual atau Bagikan Informasi Pribadi Saya": kami tidak menjual. Penduduk California dapat menghubungi support@somyung.cc untuk menggunakan hak mengetahui, menghapus, mengoreksi, dan bebas dari diskriminasi.'] },
      { title: '9. Petugas Perlindungan Data dan Kontak', body: ['Petugas perlindungan data pribadi (CPO): Yohan Lee (privacy@somyung.cc)', 'Kontak privasi: support@somyung.cc', 'Operator: HarmonyOn / Perwakilan: Yohan Lee'] },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '12 de junio de 2026',
    intro: 'SoMyung ayuda a padres y tutores a entender el temperamento de un niño mediante análisis Saju. Esta política explica qué datos personales se procesan, para qué se usan y cómo se protegen.',
    sections: [
      { title: '1. Datos que Procesamos', table: { headers: ['Contexto', 'Datos', 'Finalidad', 'Conservación'], rows: [['Vista previa gratuita', 'Apodo o nombre del niño, fecha/hora de nacimiento, género, lugar de nacimiento, rol y datos opcionales de nacimiento del padre/madre', 'Generar vista previa de temperamento', 'No se guarda en la base de datos. Puede haber logs temporales de infraestructura/API'], ['Informe pagado o promocional', 'Datos de entrada, email, datos Saju generados, informe AI, PDF', 'Generar, mostrar, entregar y dar soporte al informe', 'Conservación limitada para acceso y soporte. Eliminación bajo solicitud salvo registros legalmente necesarios'], ['Pago', 'Email, orden/autorización PayPal, estado, importe', 'Procesar pago, reembolsos, registros de transacción', 'Conservado según necesidades comerciales, fiscales, disputas y auditoría'], ['Cookies analíticas', 'Cookies/identificadores de Google Analytics', 'Mejora del servicio', 'Solo tras consentimiento']] } },
      { title: '2. Bases Legales del Tratamiento (Art. 6 RGPD)', body: ['Cuando se aplica el RGPD de la UE/Reino Unido, tratamos los datos personales sobre las siguientes bases legales:'], bullets: ['Vista previa gratuita: su consentimiento (art. 6(1)(a)). Puede retirarlo en cualquier momento.', 'Informe pagado o promocional: ejecución de un contrato (art. 6(1)(b)).', 'Registros de pago y transacción: cumplimiento de obligaciones legales (art. 6(1)(c)) y ejecución de un contrato (art. 6(1)(b)).', 'Cookies analíticas: su consentimiento mediante el banner de cookies (art. 6(1)(a)).'] },
      { title: '3. Datos de Menores y Tutor', body: ['El servicio está dirigido a padres o tutores, no a niños que lo usen por su cuenta. Los datos de un niño solo deben ser ingresados por un padre, madre o tutor legal autorizado.', 'Este servicio está diseñado para que padres y tutores legales lo usen en nombre de sus hijos. No recopilamos a sabiendas información personal directamente de menores de 13 años. Si cree que un menor de 13 años ha proporcionado datos directamente, contacte support@somyung.cc y los eliminaremos de inmediato (COPPA).'] },
      { title: '4. Procesamiento Internacional y Proveedores', body: ['Fecha de nacimiento, hora, género, lugar de nacimiento e informes generados se tratan como datos personales cuando se relacionan con un niño o una familia.', 'Cuando los datos personales se procesan fuera del EEE, el Reino Unido o Corea, se transfieren conforme a las Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea o salvaguardias legales equivalentes.'], table: { headers: ['Proveedor', 'Región', 'Datos', 'Finalidad'], rows: [['Supabase', 'EE. UU./global', 'Cuenta, informes, datos de base de datos relacionados con pagos', 'Base de datos y autenticación'], ['AWS', 'Corea/global', 'Solicitudes API y datos procesados por servidor', 'Backend y logs'], ['Cloudflare', 'Global', 'Solicitudes web, caché, logs de seguridad', 'Hosting y seguridad'], ['OpenAI o Google Gemini', 'EE. UU./global', 'Datos Saju mínimos necesarios para el análisis', 'Generación de informe AI'], ['PayPal', 'Global', 'Pagador, orden, autorización, estado de pago', 'Procesamiento de pagos'], ['Resend', 'EE. UU./global', 'Email, contenido/PDF del informe', 'Envío de email'], ['Google Analytics', 'Global', 'Cookies, dispositivo, eventos de uso', 'Analítica con consentimiento']] } },
      { title: '5. Plazos de Conservación', bullets: ['Datos de la vista previa gratuita: no se guardan en la base de datos.', 'Registros de pago y transacción: se conservan 5 años conforme a la Ley coreana de Protección del Consumidor en el Comercio Electrónico y la legislación fiscal.', 'Registros de informes pagados (datos ingresados, datos Saju generados, informe, PDF): se conservan hasta que solicite su eliminación o, como máximo, 24 meses tras el último acceso (plazo predeterminado, ajustable), tras lo cual se eliminan o anonimizan.'] },
      { title: '6. Seguridad', bullets: ['Informes y PDF requieren un token temporal emitido por el servidor.', 'La captura de pago requiere PayPal order ID y token de pago del servidor.', 'Los scripts analíticos cargan solo tras consentimiento de cookies.'] },
      { title: '7. Sus Derechos', body: ['Puede solicitar acceso, rectificación, eliminación, limitación o retirar consentimiento escribiendo a support@somyung.cc. Algunos registros de pago/transacción pueden conservarse por obligación legal.'], bullets: ['Portabilidad de datos (art. 20 RGPD): puede solicitar una copia de los datos que proporcionó en un formato estructurado, de uso común y lectura mecánica.', 'Decisiones automatizadas (art. 22 RGPD): los informes se generan automáticamente mediante IA a partir de la información de nacimiento que usted proporciona. Se trata de un perfil generado por IA con fines informativos, de autorreflexión y entretenimiento únicamente; no produce efectos jurídicos ni impactos significativos similares y no se usa para tomar decisiones sobre usted o su hijo. Puede oponerse a este tratamiento o pedir una revisión humana en support@somyung.cc.'] },
      { title: '8. Derechos de Residentes de California (CCPA/CPRA)', body: ['No vendemos ni compartimos información personal según la definición de la Ley de Privacidad del Consumidor de California. "No vender ni compartir mi información personal": no vendemos. Los residentes de California pueden contactar support@somyung.cc para ejercer sus derechos de acceso, eliminación, corrección y no discriminación.'] },
      { title: '9. Responsable de Privacidad y Contacto', body: ['Responsable de protección de datos (CPO): Yohan Lee (privacy@somyung.cc)', 'Contacto de privacidad: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '12 de junho de 2026',
    intro: 'SoMyung ajuda pais e responsáveis a entender o temperamento de uma criança por meio de análise Saju. Esta política explica quais dados pessoais são processados, por quê e como são protegidos.',
    sections: [
      { title: '1. Dados que Processamos', table: { headers: ['Contexto', 'Dados', 'Finalidade', 'Retenção'], rows: [['Prévia gratuita', 'Nome da criança, data/hora de nascimento, gênero, local de nascimento, papel e dados de nascimento do responsável', 'Gerar prévia de temperamento', 'Não armazenado no banco de dados. Logs temporários de infraestrutura/API podem existir'], ['Relatório pago ou promocional', 'Entradas, email, dados Saju gerados, relatório AI, PDF', 'Gerar, exibir, entregar e dar suporte ao relatório', 'Retido de forma limitada para acesso e suporte. Excluído sob solicitação salvo registros exigidos por lei'], ['Pagamento', 'Email, pedido/autorização PayPal, status, valor', 'Processar pagamento, reembolso e registros de transação', 'Retido conforme necessidades comerciais, fiscais, disputas e auditoria'], ['Cookies analíticos', 'Cookies/identificadores Google Analytics', 'Melhoria do serviço', 'Usado somente após consentimento']] } },
      { title: '2. Bases Legais do Tratamento (Art. 6 do RGPD)', body: ['Quando o RGPD da UE/Reino Unido se aplica, tratamos dados pessoais com base nas seguintes bases legais:'], bullets: ['Prévia gratuita: seu consentimento (art. 6(1)(a)). Você pode retirá-lo a qualquer momento.', 'Relatório pago ou promocional: execução de um contrato (art. 6(1)(b)).', 'Registros de pagamento e transação: cumprimento de obrigações legais (art. 6(1)(c)) e execução de um contrato (art. 6(1)(b)).', 'Cookies analíticos: seu consentimento por meio do banner de cookies (art. 6(1)(a)).'] },
      { title: '3. Dados de Crianças e Responsável', body: ['O serviço é destinado a pais ou responsáveis, não a crianças usando por conta própria. Dados de criança só devem ser inseridos por pai, mãe ou responsável legal autorizado.', 'Este serviço foi projetado para que pais e responsáveis legais o usem em nome de seus filhos. Não coletamos intencionalmente informações pessoais diretamente de crianças menores de 13 anos. Se você acredita que uma criança menor de 13 anos forneceu dados diretamente, contate support@somyung.cc para exclusão imediata (COPPA).'] },
      { title: '4. Processamento Internacional e Fornecedores', body: ['Data/hora de nascimento, gênero, local de nascimento e relatórios gerados são tratados como dados pessoais quando relacionados a uma criança ou família.', 'Quando dados pessoais são processados fora do EEE, do Reino Unido ou da Coreia, são transferidos com base nas Cláusulas Contratuais-Padrão (SCC) aprovadas pela Comissão Europeia ou salvaguardas legais equivalentes.'], table: { headers: ['Fornecedor', 'Região', 'Dados', 'Finalidade'], rows: [['Supabase', 'EUA/global', 'Conta, relatórios, dados de banco relacionados a pagamentos', 'Banco de dados e autenticação'], ['AWS', 'Coreia/global', 'Requisições API e dados processados no servidor', 'Execução backend e logs'], ['Cloudflare', 'Global', 'Requisições web, cache, logs de segurança', 'Hospedagem e segurança'], ['OpenAI ou Google Gemini', 'EUA/global', 'Dados Saju mínimos necessários para análise', 'Geração de relatório AI'], ['PayPal', 'Global', 'Pagador, pedido, autorização, status', 'Processamento de pagamento'], ['Resend', 'EUA/global', 'Email, conteúdo/PDF do relatório', 'Envio de email'], ['Google Analytics', 'Global', 'Cookies, dispositivo, eventos de uso', 'Analytics com consentimento']] } },
      { title: '5. Prazos de Retenção', bullets: ['Dados da prévia gratuita: não são armazenados no banco de dados.', 'Registros de pagamento e transação: mantidos por 5 anos conforme a Lei coreana de Proteção ao Consumidor no Comércio Eletrônico e a legislação tributária.', 'Registros de relatórios pagos (dados inseridos, dados Saju gerados, relatório, PDF): mantidos até você solicitar a exclusão ou, no máximo, 24 meses após o último acesso (prazo padrão, ajustável), quando são excluídos ou anonimizados.'] },
      { title: '6. Segurança', bullets: ['Relatórios e PDFs exigem token temporário emitido pelo servidor.', 'Captura de pagamento exige PayPal order ID e token de pagamento do servidor.', 'Scripts analíticos carregam apenas após consentimento de cookies.'] },
      { title: '7. Seus Direitos', body: ['Você pode solicitar acesso, correção, exclusão, restrição ou retirar consentimento pelo email support@somyung.cc. Alguns registros de pagamento/transação podem ser retidos por obrigação legal.'], bullets: ['Portabilidade de dados (art. 20 do RGPD): você pode solicitar uma cópia dos dados fornecidos em formato estruturado, de uso comum e legível por máquina.', 'Decisões automatizadas (art. 22 do RGPD): os relatórios são gerados automaticamente por IA com base nas informações de nascimento fornecidas. Trata-se de um perfil gerado por IA apenas para fins informativos, de autorreflexão e entretenimento; não produz efeitos jurídicos nem impactos significativos semelhantes e não é usado para tomar decisões sobre você ou seu filho. Você pode se opor a esse tratamento ou pedir revisão humana em support@somyung.cc.'] },
      { title: '8. Direitos de Residentes da Califórnia (CCPA/CPRA)', body: ['Não vendemos nem compartilhamos informações pessoais conforme definido pela Lei de Privacidade do Consumidor da Califórnia. "Não vender nem compartilhar minhas informações pessoais": não vendemos. Residentes da Califórnia podem contatar support@somyung.cc para exercer os direitos de acesso, exclusão, correção e não discriminação.'] },
      { title: '9. Encarregado de Privacidade e Contato', body: ['Encarregado de proteção de dados (CPO): Yohan Lee (privacy@somyung.cc)', 'Contato de privacidade: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  fr: {
    title: 'Politique de Confidentialité',
    effectiveDate: '29 avril 2026',
    updatedDate: '12 juin 2026',
    intro: 'SoMyung aide les parents et tuteurs à comprendre le tempérament d’un enfant grâce à l’analyse Saju. Cette politique explique les données personnelles traitées, les finalités et les protections.',
    sections: [
      { title: '1. Données Traitées', table: { headers: ['Contexte', 'Données', 'Finalité', 'Conservation'], rows: [['Aperçu gratuit', 'Nom de l’enfant, date/heure de naissance, genre, lieu de naissance, rôle et données de naissance du parent', 'Générer un aperçu du tempérament', 'Non stocké en base de données. Des logs temporaires d’infrastructure/API peuvent exister'], ['Rapport payant ou promotionnel', 'Données saisies, email, données Saju générées, rapport IA, PDF', 'Générer, afficher, livrer et soutenir le rapport', 'Conservation limitée pour accès et support. Suppression sur demande sauf obligations légales'], ['Paiement', 'Email, commande/autorisation PayPal, statut, montant', 'Paiement, remboursement, enregistrement de transaction', 'Conservé selon les besoins commerciaux, fiscaux, litiges et audit'], ['Cookies analytiques', 'Cookies/identifiants Google Analytics', 'Amélioration du service', 'Utilisés seulement après consentement']] } },
      { title: '2. Bases Légales du Traitement (Art. 6 RGPD)', body: ['Lorsque le RGPD de l’UE/du Royaume-Uni s’applique, nous traitons les données personnelles sur les bases légales suivantes :'], bullets: ['Aperçu gratuit : votre consentement (art. 6(1)(a)). Vous pouvez le retirer à tout moment.', 'Rapport payant ou promotionnel : exécution d’un contrat (art. 6(1)(b)).', 'Enregistrements de paiement et de transaction : respect d’obligations légales (art. 6(1)(c)) et exécution d’un contrat (art. 6(1)(b)).', 'Cookies analytiques : votre consentement via la bannière cookies (art. 6(1)(a)).'] },
      { title: '3. Données d’Enfants et Tuteur', body: ['Le service s’adresse aux parents ou tuteurs, pas aux enfants l’utilisant seuls. Les données d’un enfant doivent être saisies uniquement par un parent ou tuteur légal autorisé.', 'Ce service est conçu pour être utilisé par les parents et tuteurs légaux au nom de leurs enfants. Nous ne collectons pas sciemment d’informations personnelles directement auprès d’enfants de moins de 13 ans. Si vous pensez qu’un enfant de moins de 13 ans a fourni des données directement, contactez support@somyung.cc pour une suppression immédiate (COPPA).'] },
      { title: '4. Traitement International et Prestataires', body: ['Date/heure de naissance, genre, lieu de naissance et rapports générés sont traités comme données personnelles lorsqu’ils se rapportent à un enfant ou une famille.', 'Lorsque des données personnelles sont traitées en dehors de l’EEE, du Royaume-Uni ou de la Corée, elles sont transférées selon les Clauses Contractuelles Types (SCC) approuvées par la Commission européenne ou des garanties légales équivalentes.'], table: { headers: ['Prestataire', 'Région', 'Données', 'Finalité'], rows: [['Supabase', 'États-Unis/global', 'Compte, rapports, données DB liées aux paiements', 'Base de données et authentification'], ['AWS', 'Corée/global', 'Requêtes API et données serveur', 'Backend et logs'], ['Cloudflare', 'Global', 'Requêtes web, cache, logs sécurité', 'Hébergement et sécurité'], ['OpenAI ou Google Gemini', 'États-Unis/global', 'Données Saju minimales nécessaires à l’analyse', 'Génération de rapport IA'], ['PayPal', 'Global', 'Payeur, commande, autorisation, statut', 'Traitement du paiement'], ['Resend', 'États-Unis/global', 'Email, contenu/PDF du rapport', 'Envoi email'], ['Google Analytics', 'Global', 'Cookies, appareil, événements d’usage', 'Analyse avec consentement']] } },
      { title: '5. Durées de Conservation', bullets: ['Données de l’aperçu gratuit : non stockées en base de données.', 'Enregistrements de paiement et de transaction : conservés 5 ans conformément à la loi coréenne sur la protection des consommateurs dans le commerce électronique et à la législation fiscale.', 'Enregistrements des rapports payants (données saisies, données Saju générées, rapport, PDF) : conservés jusqu’à votre demande de suppression ou au maximum 24 mois après le dernier accès (durée par défaut, ajustable), puis supprimés ou anonymisés.'] },
      { title: '6. Sécurité', bullets: ['Les rapports et PDF nécessitent un token temporaire émis par le serveur.', 'La capture de paiement nécessite le PayPal order ID et un token de paiement serveur.', 'Les scripts analytiques chargent seulement après consentement cookies.'] },
      { title: '7. Vos Droits', body: ['Vous pouvez demander accès, rectification, suppression, limitation ou retrait du consentement via support@somyung.cc. Certains enregistrements de paiement/transaction peuvent être conservés légalement.'], bullets: ['Portabilité des données (art. 20 RGPD) : vous pouvez demander une copie des données fournies dans un format structuré, couramment utilisé et lisible par machine.', 'Décisions automatisées (art. 22 RGPD) : les rapports sont générés automatiquement par IA à partir des informations de naissance fournies. Il s’agit d’un profilage généré par IA, fourni uniquement à des fins d’information, d’introspection et de divertissement ; il ne produit aucun effet juridique ni impact significatif similaire et n’est pas utilisé pour prendre des décisions vous concernant ou concernant votre enfant. Vous pouvez vous opposer à ce traitement ou demander un examen humain à support@somyung.cc.'] },
      { title: '8. Droits des Résidents de Californie (CCPA/CPRA)', body: ['Nous ne vendons ni ne partageons d’informations personnelles au sens du California Consumer Privacy Act. « Ne pas vendre ni partager mes informations personnelles » : nous ne vendons pas. Les résidents de Californie peuvent contacter support@somyung.cc pour exercer leurs droits d’accès, de suppression, de rectification et de non-discrimination.'] },
      { title: '9. Responsable de la Protection des Données et Contact', body: ['Responsable de la protection des données (CPO) : Yohan Lee (privacy@somyung.cc)', 'Contact confidentialité: support@somyung.cc', 'Opérateur: HarmonyOn / Représentant: Yohan Lee'] },
    ],
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    effectiveDate: '29 เมษายน 2026',
    updatedDate: '12 มิถุนายน 2026',
    intro: 'SoMyung เป็นบริการวิเคราะห์ Saju สำหรับพ่อแม่หรือผู้ปกครองเพื่อเข้าใจลักษณะนิสัยของเด็ก นโยบายนี้อธิบายข้อมูลส่วนบุคคลที่ประมวลผล วัตถุประสงค์ และการปกป้องข้อมูล',
    sections: [
      { title: '1. ข้อมูลที่เราประมวลผล', table: { headers: ['บริบท', 'ข้อมูล', 'วัตถุประสงค์', 'การเก็บรักษา'], rows: [['ตัวอย่างฟรี', 'ชื่อเด็ก วัน/เวลาเกิด เพศ สถานที่เกิด บทบาทและข้อมูลเกิดของผู้ปกครอง', 'สร้างตัวอย่างการวิเคราะห์นิสัย', 'ไม่บันทึกในฐานข้อมูล แต่อาจมี log ระบบ/API ชั่วคราว'], ['รายงานแบบชำระเงิน/โปรโมชัน', 'ข้อมูลที่กรอก อีเมล ข้อมูล Saju รายงาน AI และ PDF', 'สร้าง แสดง ส่ง และสนับสนุนรายงาน', 'เก็บระยะเวลาจำกัดเพื่อเข้าถึงและสนับสนุน ลบเมื่อร้องขอ ยกเว้นข้อมูลที่ต้องเก็บตามกฎหมาย'], ['การชำระเงิน', 'อีเมล ข้อมูลคำสั่งซื้อ/อนุมัติ PayPal สถานะและจำนวนเงิน', 'ประมวลผลการชำระเงิน คืนเงิน และบันทึกธุรกรรม', 'เก็บตามความจำเป็นด้านการค้า ภาษี ข้อพิพาท และตรวจสอบ'], ['คุกกี้วิเคราะห์', 'คุกกี้/ตัวระบุ Google Analytics', 'วิเคราะห์เพื่อปรับปรุงบริการ', 'ใช้เฉพาะเมื่อยินยอม']] } },
      { title: '2. ฐานทางกฎหมายในการประมวลผล (มาตรา 6 GDPR)', body: ['เมื่อ GDPR ของสหภาพยุโรป/สหราชอาณาจักรมีผลบังคับใช้ เราประมวลผลข้อมูลส่วนบุคคลตามฐานทางกฎหมายดังนี้:'], bullets: ['ตัวอย่างฟรี: ความยินยอมของคุณ (มาตรา 6(1)(a)) คุณสามารถถอนความยินยอมได้ทุกเมื่อ', 'รายงานแบบชำระเงิน/โปรโมชัน: การปฏิบัติตามสัญญา (มาตรา 6(1)(b))', 'บันทึกการชำระเงินและธุรกรรม: การปฏิบัติตามหน้าที่ตามกฎหมาย (มาตรา 6(1)(c)) และการปฏิบัติตามสัญญา (มาตรา 6(1)(b))', 'คุกกี้วิเคราะห์: ความยินยอมผ่านแบนเนอร์คุกกี้ (มาตรา 6(1)(a))'] },
      { title: '3. ข้อมูลเด็กและผู้ปกครอง', body: ['บริการนี้มีไว้สำหรับพ่อแม่หรือผู้ปกครอง ไม่ใช่สำหรับเด็กใช้งานเอง ข้อมูลเด็กควรถูกกรอกโดยพ่อแม่หรือผู้ปกครองตามกฎหมายที่มีสิทธิ์เท่านั้น', 'บริการนี้ออกแบบมาให้พ่อแม่/ผู้ปกครองตามกฎหมายใช้แทนบุตรหลาน เราไม่เจตนาเก็บข้อมูลส่วนบุคคลโดยตรงจากเด็กอายุต่ำกว่า 13 ปี หากคุณเชื่อว่าเด็กอายุต่ำกว่า 13 ปีให้ข้อมูลโดยตรง กรุณาติดต่อ support@somyung.cc เพื่อให้เราลบทันที (COPPA)'] },
      { title: '4. การประมวลผลข้ามประเทศและผู้ให้บริการ', body: ['วันเกิด เวลาเกิด เพศ สถานที่เกิด และรายงานที่สร้างขึ้นถือเป็นข้อมูลส่วนบุคคลเมื่อเกี่ยวข้องกับเด็กหรือครอบครัว', 'เมื่อข้อมูลส่วนบุคคลถูกประมวลผลนอก EEA สหราชอาณาจักร หรือเกาหลี ข้อมูลจะถูกโอนตามข้อสัญญามาตรฐาน (SCC) ที่คณะกรรมาธิการยุโรปอนุมัติ หรือมาตรการคุ้มครองทางกฎหมายที่เทียบเท่า'], table: { headers: ['ผู้ให้บริการ', 'ภูมิภาค', 'ข้อมูล', 'วัตถุประสงค์'], rows: [['Supabase', 'สหรัฐฯ/ทั่วโลก', 'บัญชี รายงาน ข้อมูลฐานข้อมูลเกี่ยวกับการชำระเงิน', 'ฐานข้อมูลและการยืนยันตัวตน'], ['AWS', 'เกาหลี/ทั่วโลก', 'คำขอ API และข้อมูลประมวลผลบนเซิร์ฟเวอร์', 'รัน backend และ log'], ['Cloudflare', 'ทั่วโลก', 'คำขอเว็บ cache และ log ความปลอดภัย', 'โฮสติ้งและความปลอดภัย'], ['OpenAI หรือ Google Gemini', 'สหรัฐฯ/ทั่วโลก', 'ข้อมูล Saju ขั้นต่ำที่จำเป็นต่อการวิเคราะห์', 'สร้างรายงาน AI'], ['PayPal', 'ทั่วโลก', 'ผู้ชำระเงิน คำสั่งซื้อ การอนุมัติ สถานะ', 'ประมวลผลการชำระเงิน'], ['Resend', 'สหรัฐฯ/ทั่วโลก', 'อีเมล เนื้อหาอีเมล/PDF รายงาน', 'ส่งอีเมล'], ['Google Analytics', 'ทั่วโลก', 'คุกกี้ อุปกรณ์ เหตุการณ์การใช้งาน', 'วิเคราะห์ตามความยินยอม']] } },
      { title: '5. ระยะเวลาการเก็บรักษา', bullets: ['ข้อมูลตัวอย่างฟรี: ไม่บันทึกในฐานข้อมูล', 'บันทึกการชำระเงินและธุรกรรม: เก็บ 5 ปีตามกฎหมายคุ้มครองผู้บริโภคในพาณิชย์อิเล็กทรอนิกส์ของเกาหลีและกฎหมายภาษี', 'บันทึกรายงานแบบชำระเงิน (ข้อมูลที่กรอก ข้อมูล Saju ที่สร้าง รายงาน PDF): เก็บจนกว่าคุณจะขอลบ หรือสูงสุด 24 เดือนหลังการเข้าถึงครั้งสุดท้าย (ระยะเวลาเริ่มต้น อาจปรับเปลี่ยนได้) จากนั้นจะถูกลบหรือทำให้ไม่ระบุตัวตน'] },
      { title: '6. ความปลอดภัย', bullets: ['รายงานและ PDF ต้องใช้ token แบบจำกัดเวลาจากเซิร์ฟเวอร์', 'การยืนยันการชำระเงินต้องใช้ PayPal order ID และ token การชำระเงินจากเซิร์ฟเวอร์', 'สคริปต์วิเคราะห์โหลดหลังจากยินยอมคุกกี้เท่านั้น'] },
      { title: '7. สิทธิของคุณ', body: ['คุณสามารถขอเข้าถึง แก้ไข ลบ จำกัดการประมวลผล หรือถอนความยินยอมได้ที่ support@somyung.cc ข้อมูลธุรกรรมบางรายการอาจต้องเก็บตามกฎหมาย'], bullets: ['สิทธิในการโอนย้ายข้อมูล (มาตรา 20 GDPR): คุณสามารถขอสำเนาข้อมูลที่คุณให้ไว้ในรูปแบบที่มีโครงสร้าง ใช้กันทั่วไป และอ่านได้ด้วยเครื่อง', 'การตัดสินใจอัตโนมัติ (มาตรา 22 GDPR): รายงานถูกสร้างโดย AI โดยอัตโนมัติจากข้อมูลการเกิดที่คุณให้ เป็นการวิเคราะห์โปรไฟล์ที่สร้างโดย AI เพื่อวัตถุประสงค์ด้านข้อมูล การไตร่ตรองตนเอง และความบันเทิงเท่านั้น ไม่มีผลทางกฎหมายหรือผลกระทบสำคัญในลักษณะเดียวกัน และไม่ถูกใช้ตัดสินใจเกี่ยวกับคุณหรือบุตรหลาน คุณสามารถคัดค้านการประมวลผลนี้หรือขอให้มีการตรวจสอบโดยมนุษย์ได้ที่ support@somyung.cc'] },
      { title: '8. สิทธิของผู้พำนักในแคลิฟอร์เนีย (CCPA/CPRA)', body: ['เราไม่ขายหรือแบ่งปันข้อมูลส่วนบุคคลตามนิยามของกฎหมาย California Consumer Privacy Act "อย่าขายหรือแบ่งปันข้อมูลส่วนบุคคลของฉัน": เราไม่ขายข้อมูล ผู้พำนักในแคลิฟอร์เนียสามารถติดต่อ support@somyung.cc เพื่อใช้สิทธิรับรู้ ลบ แก้ไข และไม่ถูกเลือกปฏิบัติ'] },
      { title: '9. ผู้รับผิดชอบด้านการคุ้มครองข้อมูลและการติดต่อ', body: ['ผู้รับผิดชอบด้านการคุ้มครองข้อมูลส่วนบุคคล (CPO): Yohan Lee (privacy@somyung.cc)', 'ติดต่อเรื่องความเป็นส่วนตัว: support@somyung.cc', 'ผู้ดำเนินการ: HarmonyOn / ตัวแทน: Yohan Lee'] },
    ],
  },
}

const termsContent: Record<SupportedLegalLanguage, LegalPageContent> = {
  ko: {
    title: '이용약관',
    effectiveDate: '2026년 4월 29일',
    updatedDate: '2026년 6월 12일',
    intro: '본 약관은 SoMyung 서비스 이용 조건을 설명합니다.',
    sections: [
      { title: '1. 서비스 성격', body: ['SoMyung은 사주 명리학과 AI를 활용한 기질 분석 참고 자료를 제공합니다. 결과는 의사결정 보조 정보이며 의료, 법률, 재정, 심리치료 조언이 아닙니다.', '본 리포트는 오락(엔터테인먼트) 및 자기 성찰 목적으로만 제공되며, 의료, 심리, 법률 자문이 아닙니다. 리포트만을 근거로 어떠한 결정도 내려서는 안 됩니다.'] },
      { title: '2. 이용자 책임', bullets: ['정확한 정보를 입력해야 합니다.', '아동 정보는 부모 또는 법정대리인만 입력할 수 있습니다.', '만 14세 미만 아동은 본 서비스를 직접 이용할 수 없습니다. 만 14세 미만이 보호자의 관여 없이 직접 정보를 입력한 경우, 운영자는 해당 이용에 대해 책임을 지지 않으며 인지하는 즉시 해당 정보를 삭제합니다.', '결과를 중요한 결정의 유일한 근거로 사용하지 않아야 합니다.'] },
      { title: '3. 무료 및 유료 서비스', body: ['무료 미리보기는 화면에 즉시 표시됩니다. 유료 또는 프로모 리포트는 결제 또는 유효한 프로모 코드 확인 후 생성되며, 화면/PDF/이메일로 제공될 수 있습니다.'] },
      { title: '4. 결제와 환불', body: ['결제는 PayPal을 통해 처리됩니다. 디지털 리포트 생성이 시작된 후에는 환불 또는 청약철회가 제한될 수 있습니다. 결제 오류나 중복 결제는 support@somyung.cc로 문의해주세요.'] },
      { title: '5. 지식재산권', body: ['서비스 화면, 콘텐츠, 리포트 구성, 브랜드 요소의 권리는 운영자에게 있습니다. 사용자는 개인적, 비상업적 목적으로 리포트를 이용할 수 있습니다.'] },
      { title: '6. 서비스 변경 및 중단', body: ['시스템 점검, 보안, 외부 서비스 장애, 법령 준수 사유로 서비스가 변경되거나 일시 중단될 수 있습니다.'] },
      { title: '7. 문의', body: ['문의: support@somyung.cc', '운영자: 하모니온 / 대표: 이요한'] },
    ],
  },
  en: {
    title: 'Terms of Service',
    effectiveDate: 'April 29, 2026',
    updatedDate: 'June 12, 2026',
    intro: 'These terms explain how you may use SoMyung.',
    sections: [
      { title: '1. Nature of the Service', body: ['SoMyung provides temperament analysis using Saju and AI. Results are reference materials only and are not medical, legal, financial, psychological, or professional advice.', 'The report is provided for entertainment and self-reflection purposes only; it is not medical, psychological, or legal advice, and no decision should be made on the basis of the report alone.'] },
      { title: '2. User Responsibilities', bullets: ['Provide accurate information.', 'Enter child data only if you are the parent or legal guardian with authority to do so.', 'Children under 14 may not use this service directly. If a person under 14 enters data without parent or guardian involvement, the operator assumes no responsibility for that use and will delete such data upon becoming aware of it.', 'Do not use the report as the sole basis for important decisions.'] },
      { title: '3. Free and Paid Services', body: ['The free preview is shown on screen. Paid or promo reports are generated after payment or a valid promo code and may be provided on screen, as PDF, and by email.'] },
      { title: '4. Payment and Refunds', body: ['Payments are processed through PayPal. Refund or cancellation rights may be limited after digital report generation begins. Contact support@somyung.cc for payment errors or duplicate charges.'] },
      { title: '5. Intellectual Property', body: ['The service UI, content, report structure, and brand assets belong to the operator. You may use your report for personal, non-commercial purposes.'] },
      { title: '6. Changes and Availability', body: ['The service may change or pause for maintenance, security, third-party outages, or legal compliance.'] },
      { title: '7. Contact', body: ['Contact: support@somyung.cc', 'Operator: HarmonyOn / Representative: Yohan Lee'] },
    ],
  },
  ja: {
    title: '利用規約',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年6月12日',
    intro: '本規約はSoMyungの利用条件を説明します。',
    sections: [
      { title: '1. サービスの性質', body: ['SoMyungはSajuとAIを用いた気質分析の参考資料を提供します。医療、法律、金融、心理治療その他の専門的助言ではありません。', '本レポートは娯楽（エンターテインメント）および自己省察の目的でのみ提供され、医療、心理、法律に関する助言ではありません。レポートのみを根拠に意思決定を行わないでください。'] },
      { title: '2. 利用者の責任', bullets: ['正確な情報を入力してください。', 'お子様の情報は権限を持つ親または法定代理人のみ入力できます。', '14歳未満のお子様は本サービスを直接利用できません。14歳未満の方が保護者の関与なく直接情報を入力した場合、運営者はその利用について責任を負わず、認識した時点で当該情報を削除します。', '重要な決定の唯一の根拠として利用しないでください。'] },
      { title: '3. 無料・有料サービス', body: ['無料プレビューは画面上に表示されます。有料またはプロモレポートは決済または有効なコード確認後に生成され、画面、PDF、メールで提供される場合があります。'] },
      { title: '4. 決済と返金', body: ['決済はPayPalで処理されます。デジタルレポート生成開始後は返金・キャンセルが制限される場合があります。'] },
      { title: '5. 知的財産', body: ['サービス画面、コンテンツ、レポート構成、ブランド資産は運営者に帰属します。レポートは個人的・非商用目的で利用できます。'] },
      { title: '6. 変更・停止', body: ['保守、セキュリティ、外部サービス障害、法令遵守のためサービスが変更または一時停止される場合があります。'] },
      { title: '7. 連絡先', body: ['連絡先: support@somyung.cc', '運営者: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  zh: {
    title: '服务条款',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年6月12日',
    intro: '本条款说明您如何使用 SoMyung。',
    sections: [
      { title: '1. 服务性质', body: ['SoMyung 使用四柱和 AI 提供气质分析参考资料，不构成医疗、法律、财务、心理治疗或其他专业建议。', '本报告仅用于娱乐和自我反思目的，不构成医疗、心理或法律建议，请勿仅凭报告做出任何决定。'] },
      { title: '2. 用户责任', bullets: ['请提供准确的信息。', '儿童信息只能由有权的父母或法定监护人输入。', '14岁以下儿童不得直接使用本服务。如14岁以下者在无监护人参与的情况下直接输入信息，运营方对该使用不承担责任，并将在知悉后删除相关信息。', '请勿将报告作为重要决定的唯一依据。'] },
      { title: '3. 免费与付费服务', body: ['免费预览在页面上显示。付费或优惠报告在支付或优惠码确认后生成，并可能通过页面、PDF和邮件提供。'] },
      { title: '4. 支付与退款', body: ['支付通过 PayPal 处理。数字报告开始生成后，退款或取消权可能受到限制。支付错误或重复扣款请联系 support@somyung.cc。'] },
      { title: '5. 知识产权', body: ['服务界面、内容、报告结构和品牌资产归运营方所有。您可以将报告用于个人非商业目的。'] },
      { title: '6. 服务变更', body: ['因维护、安全、第三方故障或合规原因，服务可能变更或暂停。'] },
      { title: '7. 联系方式', body: ['联系: support@somyung.cc', '运营方: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  vi: {
    title: 'Điều khoản dịch vụ',
    effectiveDate: '29/04/2026',
    updatedDate: '12/06/2026',
    intro: 'Các điều khoản này giải thích cách bạn có thể sử dụng SoMyung.',
    sections: [
      { title: '1. Bản chất dịch vụ', body: ['SoMyung cung cấp tài liệu tham khảo về khí chất bằng Saju và AI. Kết quả không phải là tư vấn y tế, pháp lý, tài chính, tâm lý trị liệu hoặc tư vấn chuyên môn.', 'Báo cáo chỉ được cung cấp cho mục đích giải trí và tự suy ngẫm; không phải là tư vấn y tế, tâm lý hay pháp lý, và không nên đưa ra bất kỳ quyết định nào chỉ dựa trên báo cáo.'] },
      { title: '2. Trách nhiệm người dùng', bullets: ['Cung cấp thông tin chính xác.', 'Chỉ nhập dữ liệu trẻ em nếu bạn là cha mẹ hoặc người giám hộ hợp pháp có thẩm quyền.', 'Trẻ dưới 14 tuổi không được trực tiếp sử dụng dịch vụ này. Nếu người dưới 14 tuổi tự nhập dữ liệu mà không có sự tham gia của cha mẹ/người giám hộ, đơn vị vận hành không chịu trách nhiệm về việc sử dụng đó và sẽ xóa dữ liệu ngay khi biết.', 'Không dùng báo cáo làm cơ sở duy nhất cho quyết định quan trọng.'] },
      { title: '3. Dịch vụ miễn phí và trả phí', body: ['Bản xem trước miễn phí hiển thị trên màn hình. Báo cáo trả phí/khuyến mãi được tạo sau khi thanh toán hoặc xác nhận mã hợp lệ và có thể được cung cấp trên màn hình, PDF và email.'] },
      { title: '4. Thanh toán và hoàn tiền', body: ['Thanh toán được xử lý qua PayPal. Quyền hoàn tiền hoặc hủy có thể bị giới hạn sau khi bắt đầu tạo báo cáo số.'] },
      { title: '5. Sở hữu trí tuệ', body: ['Giao diện, nội dung, cấu trúc báo cáo và thương hiệu thuộc về đơn vị vận hành. Bạn có thể dùng báo cáo cho mục đích cá nhân, phi thương mại.'] },
      { title: '6. Thay đổi và khả dụng', body: ['Dịch vụ có thể thay đổi hoặc tạm dừng vì bảo trì, bảo mật, sự cố bên thứ ba hoặc tuân thủ pháp luật.'] },
      { title: '7. Liên hệ', body: ['Liên hệ: support@somyung.cc', 'Đơn vị vận hành: HarmonyOn / Đại diện: Yohan Lee'] },
    ],
  },
  id: {
    title: 'Syarat & Ketentuan',
    effectiveDate: '29 April 2026',
    updatedDate: '12 Juni 2026',
    intro: 'Ketentuan ini menjelaskan cara Anda menggunakan SoMyung.',
    sections: [
      { title: '1. Sifat Layanan', body: ['SoMyung menyediakan materi referensi analisis temperamen menggunakan Saju dan AI. Hasil bukan nasihat medis, hukum, keuangan, psikoterapi, atau profesional.', 'Laporan disediakan hanya untuk tujuan hiburan dan refleksi diri; bukan nasihat medis, psikologis, atau hukum, dan jangan membuat keputusan apa pun hanya berdasarkan laporan.'] },
      { title: '2. Tanggung Jawab Pengguna', bullets: ['Berikan informasi yang akurat.', 'Masukkan data anak hanya jika Anda orang tua atau wali sah yang berwenang.', 'Anak di bawah 14 tahun tidak boleh menggunakan layanan ini secara langsung. Jika seseorang di bawah 14 tahun memasukkan data tanpa keterlibatan orang tua/wali, operator tidak bertanggung jawab atas penggunaan tersebut dan akan menghapus data itu begitu mengetahuinya.', 'Jangan gunakan laporan sebagai satu-satunya dasar keputusan penting.'] },
      { title: '3. Layanan Gratis dan Berbayar', body: ['Pratinjau gratis ditampilkan di layar. Laporan berbayar atau promo dibuat setelah pembayaran atau kode promo valid dan dapat diberikan di layar, PDF, dan email.'] },
      { title: '4. Pembayaran dan Refund', body: ['Pembayaran diproses melalui PayPal. Hak refund atau pembatalan dapat dibatasi setelah pembuatan laporan digital dimulai.'] },
      { title: '5. Kekayaan Intelektual', body: ['UI, konten, struktur laporan, dan aset merek adalah milik operator. Anda dapat menggunakan laporan untuk tujuan pribadi non-komersial.'] },
      { title: '6. Perubahan dan Ketersediaan', body: ['Layanan dapat berubah atau berhenti sementara karena pemeliharaan, keamanan, gangguan pihak ketiga, atau kepatuhan hukum.'] },
      { title: '7. Kontak', body: ['Kontak: support@somyung.cc', 'Operator: HarmonyOn / Perwakilan: Yohan Lee'] },
    ],
  },
  es: {
    title: 'Términos de Servicio',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '12 de junio de 2026',
    intro: 'Estos términos explican cómo puede usar SoMyung.',
    sections: [
      { title: '1. Naturaleza del Servicio', body: ['SoMyung ofrece material de referencia de análisis de temperamento usando Saju e IA. Los resultados no son asesoramiento médico, legal, financiero, psicológico ni profesional.', 'El informe se ofrece únicamente con fines de entretenimiento y autorreflexión; no constituye asesoramiento médico, psicológico ni legal, y no debe tomarse ninguna decisión basándose solo en el informe.'] },
      { title: '2. Responsabilidades del Usuario', bullets: ['Proporcione información precisa.', 'Ingrese datos de menores solo si es padre, madre o tutor legal autorizado.', 'Los menores de 14 años no pueden usar este servicio directamente. Si una persona menor de 14 años ingresa datos sin la participación de su padre, madre o tutor, el operador no asume responsabilidad por ese uso y eliminará dichos datos en cuanto tenga conocimiento.', 'No use el informe como única base para decisiones importantes.'] },
      { title: '3. Servicios Gratuitos y Pagados', body: ['La vista previa gratuita se muestra en pantalla. Los informes pagados o promocionales se generan tras el pago o un código válido y pueden entregarse en pantalla, PDF y email.'] },
      { title: '4. Pagos y Reembolsos', body: ['Los pagos se procesan mediante PayPal. El derecho de reembolso o cancelación puede limitarse cuando empieza la generación del informe digital.'] },
      { title: '5. Propiedad Intelectual', body: ['La interfaz, contenido, estructura del informe y marca pertenecen al operador. Puede usar su informe para fines personales no comerciales.'] },
      { title: '6. Cambios y Disponibilidad', body: ['El servicio puede cambiar o pausarse por mantenimiento, seguridad, fallos de terceros o cumplimiento legal.'] },
      { title: '7. Contacto', body: ['Contacto: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  pt: {
    title: 'Termos de Serviço',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '12 de junho de 2026',
    intro: 'Estes termos explicam como você pode usar o SoMyung.',
    sections: [
      { title: '1. Natureza do Serviço', body: ['SoMyung fornece material de referência de análise de temperamento usando Saju e IA. Os resultados não são aconselhamento médico, jurídico, financeiro, psicológico ou profissional.', 'O relatório é fornecido apenas para fins de entretenimento e autorreflexão; não constitui aconselhamento médico, psicológico ou jurídico, e nenhuma decisão deve ser tomada com base apenas no relatório.'] },
      { title: '2. Responsabilidades do Usuário', bullets: ['Forneça informações precisas.', 'Insira dados de criança apenas se você for pai, mãe ou responsável legal autorizado.', 'Menores de 14 anos não podem usar este serviço diretamente. Se uma pessoa menor de 14 anos inserir dados sem o envolvimento dos pais ou responsável, o operador não assume responsabilidade por esse uso e excluirá os dados assim que tomar conhecimento.', 'Não use o relatório como única base para decisões importantes.'] },
      { title: '3. Serviços Gratuitos e Pagos', body: ['A prévia gratuita aparece na tela. Relatórios pagos ou promocionais são gerados após pagamento ou código válido e podem ser fornecidos na tela, em PDF e por email.'] },
      { title: '4. Pagamentos e Reembolsos', body: ['Pagamentos são processados pelo PayPal. O direito de reembolso ou cancelamento pode ser limitado após o início da geração do relatório digital.'] },
      { title: '5. Propriedade Intelectual', body: ['Interface, conteúdo, estrutura do relatório e marca pertencem ao operador. Você pode usar seu relatório para fins pessoais e não comerciais.'] },
      { title: '6. Alterações e Disponibilidade', body: ['O serviço pode mudar ou pausar por manutenção, segurança, falhas de terceiros ou conformidade legal.'] },
      { title: '7. Contato', body: ['Contato: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  fr: {
    title: 'Conditions d’Utilisation',
    effectiveDate: '29 avril 2026',
    updatedDate: '12 juin 2026',
    intro: 'Ces conditions expliquent comment utiliser SoMyung.',
    sections: [
      { title: '1. Nature du Service', body: ['SoMyung fournit un support de référence d’analyse du tempérament avec Saju et IA. Les résultats ne sont pas des conseils médicaux, juridiques, financiers, psychologiques ou professionnels.', 'Le rapport est fourni uniquement à des fins de divertissement et d’introspection ; il ne constitue pas un avis médical, psychologique ou juridique, et aucune décision ne doit être prise sur la seule base du rapport.'] },
      { title: '2. Responsabilités de l’Utilisateur', bullets: ['Fournir des informations exactes.', 'Saisir les données d’un enfant uniquement si vous êtes parent ou tuteur légal autorisé.', 'Les enfants de moins de 14 ans ne peuvent pas utiliser ce service directement. Si une personne de moins de 14 ans saisit des données sans l’implication d’un parent ou tuteur, l’opérateur décline toute responsabilité pour cette utilisation et supprimera ces données dès qu’il en aura connaissance.', 'Ne pas utiliser le rapport comme seule base de décisions importantes.'] },
      { title: '3. Services Gratuits et Payants', body: ['L’aperçu gratuit s’affiche à l’écran. Les rapports payants ou promotionnels sont générés après paiement ou code valide et peuvent être fournis à l’écran, en PDF et par email.'] },
      { title: '4. Paiements et Remboursements', body: ['Les paiements sont traités via PayPal. Le droit au remboursement ou à l’annulation peut être limité après le début de génération du rapport numérique.'] },
      { title: '5. Propriété Intellectuelle', body: ['L’interface, le contenu, la structure du rapport et les éléments de marque appartiennent à l’opérateur. Vous pouvez utiliser votre rapport à des fins personnelles non commerciales.'] },
      { title: '6. Modifications et Disponibilité', body: ['Le service peut changer ou être suspendu pour maintenance, sécurité, panne de tiers ou conformité légale.'] },
      { title: '7. Contact', body: ['Contact: support@somyung.cc', 'Opérateur: HarmonyOn / Représentant: Yohan Lee'] },
    ],
  },
  th: {
    title: 'ข้อกำหนดการใช้บริการ',
    effectiveDate: '29 เมษายน 2026',
    updatedDate: '12 มิถุนายน 2026',
    intro: 'ข้อกำหนดนี้อธิบายวิธีการใช้ SoMyung',
    sections: [
      { title: '1. ลักษณะของบริการ', body: ['SoMyung ให้ข้อมูลอ้างอิงการวิเคราะห์นิสัยด้วย Saju และ AI ผลลัพธ์ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย การเงิน จิตบำบัด หรือคำแนะนำวิชาชีพ', 'รายงานนี้จัดทำเพื่อความบันเทิงและการไตร่ตรองตนเองเท่านั้น ไม่ใช่คำแนะนำทางการแพทย์ จิตวิทยา หรือกฎหมาย และไม่ควรตัดสินใจใด ๆ โดยอาศัยรายงานเพียงอย่างเดียว'] },
      { title: '2. ความรับผิดชอบของผู้ใช้', bullets: ['ให้ข้อมูลที่ถูกต้อง', 'กรอกข้อมูลเด็กเฉพาะเมื่อคุณเป็นพ่อแม่หรือผู้ปกครองตามกฎหมายที่มีสิทธิ์', 'เด็กอายุต่ำกว่า 14 ปีไม่สามารถใช้บริการนี้โดยตรง หากผู้ที่อายุต่ำกว่า 14 ปีกรอกข้อมูลเองโดยไม่มีผู้ปกครองเกี่ยวข้อง ผู้ดำเนินการไม่รับผิดชอบต่อการใช้งานดังกล่าวและจะลบข้อมูลทันทีที่ทราบ', 'อย่าใช้รายงานเป็นเหตุผลเดียวในการตัดสินใจสำคัญ'] },
      { title: '3. บริการฟรีและแบบชำระเงิน', body: ['ตัวอย่างฟรีแสดงบนหน้าจอ รายงานแบบชำระเงินหรือโปรโมชันจะสร้างหลังการชำระเงินหรือยืนยันโค้ด และอาจให้ผ่านหน้าจอ PDF และอีเมล'] },
      { title: '4. การชำระเงินและคืนเงิน', body: ['การชำระเงินประมวลผลผ่าน PayPal สิทธิ์คืนเงินหรือยกเลิกอาจถูกจำกัดหลังเริ่มสร้างรายงานดิจิทัล'] },
      { title: '5. ทรัพย์สินทางปัญญา', body: ['UI เนื้อหา โครงสร้างรายงาน และแบรนด์เป็นของผู้ดำเนินการ คุณใช้รายงานเพื่อส่วนตัวและไม่ใช่เชิงพาณิชย์ได้'] },
      { title: '6. การเปลี่ยนแปลงและความพร้อมใช้งาน', body: ['บริการอาจเปลี่ยนหรือหยุดชั่วคราวเพราะการบำรุงรักษา ความปลอดภัย ปัญหาผู้ให้บริการภายนอก หรือการปฏิบัติตามกฎหมาย'] },
      { title: '7. ติดต่อ', body: ['ติดต่อ: support@somyung.cc', 'ผู้ดำเนินการ: HarmonyOn / ตัวแทน: Yohan Lee'] },
    ],
  },
}

function resolveLegalLanguage(lang: Language): SupportedLegalLanguage {
  return ['ko', 'en', 'ja', 'zh', 'vi', 'id', 'es', 'pt', 'fr', 'th'].includes(lang) ? (lang as SupportedLegalLanguage) : 'en'
}

export function getPrivacyContent(lang: Language): LegalPageContent {
  return privacyContent[resolveLegalLanguage(lang)]
}

export function getTermsContent(lang: Language): LegalPageContent {
  return termsContent[resolveLegalLanguage(lang)]
}
