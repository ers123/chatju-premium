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
    updatedDate: '2026년 4월 29일',
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
        title: '2. 아동 정보와 보호자 확인',
        body: ['이 서비스는 아이 본인이 직접 사용하는 서비스가 아니라, 부모 또는 법정대리인이 아이를 이해하기 위해 사용하는 보호자 대상 서비스입니다. 만 14세 미만 아동의 정보는 부모 또는 법정대리인만 입력할 수 있습니다.'],
      },
      {
        title: '3. 해외 이전 및 처리업체',
        body: ['서비스 제공을 위해 아래 업체가 데이터를 처리할 수 있습니다. 생년월일, 출생시간, 성별, 출생지처럼 단독으로는 이름이 없어도 특정 개인과 연결될 수 있는 정보는 개인정보로 취급합니다.'],
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
        title: '4. 보안 조치',
        bullets: ['리포트와 PDF 접근에는 서버가 발급한 제한 시간 토큰을 사용합니다.', '결제 승인에는 PayPal 주문 ID와 서버 발급 결제 토큰을 함께 확인합니다.', '분석 쿠키는 동의한 경우에만 로드됩니다.', '고객지원 로그에서는 가능한 한 이메일을 마스킹합니다.'],
      },
      {
        title: '5. 이용자의 권리',
        body: ['개인정보 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다. 요청은 support@somyung.cc로 보내주세요. 법령상 보관이 필요한 결제/거래 기록은 삭제 대신 분리 보관 또는 최소화될 수 있습니다.'],
      },
      {
        title: '6. 문의',
        body: ['개인정보 관련 문의: support@somyung.cc', '사업자: 하모니온 / 대표: 이요한'],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    effectiveDate: 'April 29, 2026',
    updatedDate: 'April 29, 2026',
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
        title: '2. Children’s Data and Guardian Role',
        body: ['This service is directed to parents and guardians, not to children acting on their own. Data about a child must be entered only by a parent or legal guardian who has authority to do so.'],
      },
      {
        title: '3. International Processing and Providers',
        body: ['We treat birth date, birth time, gender, birth place, and generated reports as personal data when they relate to a child or family, even if a direct legal name is not sent to every provider.'],
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
        title: '4. Security Measures',
        bullets: ['Reports and PDFs require a server-issued time-limited token.', 'Payment capture requires both the PayPal order ID and a server-issued payment token.', 'Analytics scripts load only after cookie consent.', 'Support logs minimize directly identifying data where practical.'],
      },
      {
        title: '5. Your Rights',
        body: ['You may request access, correction, deletion, restriction, or withdrawal of consent by emailing support@somyung.cc. Some payment or transaction records may need to be retained for legal, tax, audit, refund, or dispute purposes.'],
      },
      {
        title: '6. Contact',
        body: ['Privacy contact: support@somyung.cc', 'Operator: HarmonyOn / Representative: Yohan Lee'],
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年4月29日',
    intro: 'SoMyungは、保護者がお子様の気質を理解するためのSaju分析サービスです。本ポリシーは、処理される個人データ、目的、保護方法を説明します。',
    sections: [
      { title: '1. 取り扱う個人データ', table: { headers: ['場面', 'データ', '目的', '保管'], rows: [['無料プレビュー', 'お子様のニックネームまたは名前、生年月日、出生時刻、性別、出生地、任意の保護者の役割・生年月日・出生時刻', '気質プレビューの生成', 'データベースには保存しません。ただしインフラ/APIログは一時的に残る場合があります'], ['有料/プロモレポート', '入力情報、メール、生成されたSajuデータ、AIレポート、PDF', 'レポート生成、表示、送付、サポート', '限定的なアクセスとサポートのため保管。削除依頼時は法令上必要な記録を除き削除'], ['決済', 'メール、PayPal注文/承認情報、決済状態、金額', '決済、返金、取引記録', '商取引・税務・紛争対応に必要な期間'], ['分析Cookie', 'Google Analytics Cookie/識別子', 'サービス改善分析', '同意した場合のみ使用']] } },
      { title: '2. お子様の情報と保護者確認', body: ['本サービスはお子様本人ではなく、保護者向けのサービスです。お子様の情報は、入力権限を持つ親または法定代理人のみが入力できます。'] },
      { title: '3. 国外処理と委託先', body: ['生年月日、出生時刻、性別、出生地、生成レポートは、氏名がなくても家族に結び付く場合は個人データとして扱います。'], table: { headers: ['委託先', '地域', 'データ', '目的'], rows: [['Supabase', '米国/グローバル', 'アカウント、レポート、決済関連DBデータ', 'DBと認証'], ['AWS', '韓国/グローバル', 'APIリクエスト、サーバー処理データ', 'バックエンド実行とログ'], ['Cloudflare', 'グローバル', 'Webリクエスト、キャッシュ、セキュリティログ', 'ホスティングと保護'], ['OpenAIまたはGoogle Gemini', '米国/グローバル', '分析に必要な最小限のSajuデータ', 'AIレポート生成'], ['PayPal', 'グローバル', '支払者、注文、承認、決済状態', '決済処理'], ['Resend', '米国/グローバル', 'メールアドレス、レポートメール/PDF', 'メール送信'], ['Google Analytics', 'グローバル', 'Cookie、端末、利用イベント', '同意に基づく分析']] } },
      { title: '4. セキュリティ', bullets: ['レポートとPDFには期限付きサーバートークンが必要です。', '決済確定にはPayPal注文IDとサーバー発行トークンを確認します。', '分析スクリプトはCookie同意後のみ読み込まれます。'] },
      { title: '5. 権利行使', body: ['開示、訂正、削除、処理停止、同意撤回は support@somyung.cc へご連絡ください。法令上必要な決済記録は保持される場合があります。'] },
      { title: '6. 連絡先', body: ['プライバシー窓口: support@somyung.cc', '運営者: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  zh: {
    title: '隐私政策',
    effectiveDate: '2026年4月29日',
    updatedDate: '2026年4月29日',
    intro: 'SoMyung 是面向父母/监护人的四柱气质分析服务。本政策说明我们处理哪些个人信息、处理目的以及保护措施。',
    sections: [
      { title: '1. 我们处理的信息', table: { headers: ['场景', '信息', '目的', '保存'], rows: [['免费预览', '孩子姓名、出生日期/时间、性别、出生地、父母角色及父母出生信息', '生成气质预览', '不保存到数据库；基础设施/API日志可能短期保留'], ['付费或优惠报告', '预览输入、邮箱、生成的四柱数据、AI报告、PDF', '生成、展示、发送和支持报告', '为访问和支持进行有限保存；删除请求后依法必须保留的信息除外'], ['支付', '邮箱、PayPal订单/授权数据、支付状态、金额', '支付、退款、交易记录', '按商业、税务、争议和审计需要保存'], ['分析Cookie', 'Google Analytics Cookie/标识符', '服务改进分析', '仅在同意后使用']] } },
      { title: '2. 儿童信息与监护人', body: ['本服务面向父母或法定监护人，不面向儿童独立使用。儿童信息只能由有权输入的父母或法定监护人提交。'] },
      { title: '3. 跨境处理与服务商', body: ['出生日期、出生时间、性别、出生地和生成报告在与孩子或家庭相关时均按个人信息处理。'], table: { headers: ['服务商', '地区', '信息', '目的'], rows: [['Supabase', '美国/全球', '账户、报告、支付相关数据库信息', '数据库和认证'], ['AWS', '韩国/全球', 'API请求和服务器处理数据', '后端运行和日志'], ['Cloudflare', '全球', '网页请求、缓存、安全日志', '网站托管和安全'], ['OpenAI 或 Google Gemini', '美国/全球', '分析所需的最少四柱数据', 'AI报告生成'], ['PayPal', '全球', '付款人、订单、授权、支付状态', '支付处理'], ['Resend', '美国/全球', '邮箱、报告邮件/PDF', '邮件发送'], ['Google Analytics', '全球', 'Cookie、设备和使用事件', '基于同意的分析']] } },
      { title: '4. 安全措施', bullets: ['报告和PDF需要服务器签发的限时令牌。', '支付确认需要PayPal订单ID和服务器签发的支付令牌。', '分析脚本仅在Cookie同意后加载。'] },
      { title: '5. 您的权利', body: ['您可以通过 support@somyung.cc 请求访问、更正、删除、限制处理或撤回同意。依法必须保存的支付/交易记录可能无法立即删除。'] },
      { title: '6. 联系方式', body: ['隐私联系邮箱: support@somyung.cc', '运营方: HarmonyOn / 代表: Yohan Lee'] },
    ],
  },
  vi: {
    title: 'Chính sách quyền riêng tư',
    effectiveDate: '29/04/2026',
    updatedDate: '29/04/2026',
    intro: 'SoMyung là dịch vụ phân tích Saju dành cho cha mẹ/người giám hộ để hiểu khí chất của trẻ. Chính sách này giải thích dữ liệu cá nhân được xử lý, mục đích và cách bảo vệ.',
    sections: [
      { title: '1. Dữ liệu chúng tôi xử lý', table: { headers: ['Ngữ cảnh', 'Dữ liệu', 'Mục đích', 'Lưu giữ'], rows: [['Bản xem trước miễn phí', 'Tên trẻ, ngày/giờ sinh, giới tính, nơi sinh, vai trò và thông tin sinh của phụ huynh', 'Tạo bản xem trước khí chất', 'Không lưu trong cơ sở dữ liệu; nhật ký hạ tầng/API có thể được giữ tạm thời'], ['Báo cáo trả phí/khuyến mãi', 'Dữ liệu nhập, email, dữ liệu Saju đã tạo, báo cáo AI, PDF', 'Tạo, hiển thị, gửi và hỗ trợ báo cáo', 'Lưu trong thời gian giới hạn để truy cập/hỗ trợ; xóa theo yêu cầu trừ hồ sơ phải giữ theo luật'], ['Thanh toán', 'Email, đơn hàng/ủy quyền PayPal, trạng thái, số tiền', 'Xử lý thanh toán, hoàn tiền, lưu hồ sơ giao dịch', 'Lưu theo yêu cầu thương mại, thuế, tranh chấp và kiểm toán'], ['Cookie phân tích', 'Cookie/định danh Google Analytics', 'Phân tích cải thiện dịch vụ', 'Chỉ dùng khi có đồng ý']] } },
      { title: '2. Dữ liệu trẻ em và người giám hộ', body: ['Dịch vụ này dành cho cha mẹ/người giám hộ, không dành cho trẻ tự sử dụng. Thông tin của trẻ chỉ nên được nhập bởi cha mẹ hoặc người giám hộ hợp pháp có thẩm quyền.'] },
      { title: '3. Xử lý quốc tế và nhà cung cấp', body: ['Ngày sinh, giờ sinh, giới tính, nơi sinh và báo cáo tạo ra được xem là dữ liệu cá nhân khi liên quan đến trẻ hoặc gia đình.'], table: { headers: ['Nhà cung cấp', 'Khu vực', 'Dữ liệu', 'Mục đích'], rows: [['Supabase', 'Mỹ/toàn cầu', 'Tài khoản, báo cáo, dữ liệu DB liên quan thanh toán', 'Cơ sở dữ liệu và xác thực'], ['AWS', 'Hàn Quốc/toàn cầu', 'Yêu cầu API và dữ liệu xử lý máy chủ', 'Chạy backend và nhật ký'], ['Cloudflare', 'Toàn cầu', 'Yêu cầu web, cache, nhật ký bảo mật', 'Lưu trữ web và bảo mật'], ['OpenAI hoặc Google Gemini', 'Mỹ/toàn cầu', 'Dữ liệu Saju tối thiểu cần cho phân tích', 'Tạo báo cáo AI'], ['PayPal', 'Toàn cầu', 'Người thanh toán, đơn hàng, ủy quyền, trạng thái', 'Xử lý thanh toán'], ['Resend', 'Mỹ/toàn cầu', 'Email, nội dung email/PDF báo cáo', 'Gửi email'], ['Google Analytics', 'Toàn cầu', 'Cookie, thiết bị, sự kiện sử dụng', 'Phân tích dựa trên đồng ý']] } },
      { title: '4. Bảo mật', bullets: ['Báo cáo và PDF cần token có thời hạn do máy chủ cấp.', 'Xác nhận thanh toán cần PayPal order ID và token thanh toán do máy chủ cấp.', 'Script phân tích chỉ tải sau khi đồng ý cookie.'] },
      { title: '5. Quyền của bạn', body: ['Bạn có thể yêu cầu truy cập, sửa, xóa, hạn chế xử lý hoặc rút đồng ý qua support@somyung.cc. Một số hồ sơ thanh toán/giao dịch có thể phải được giữ theo luật.'] },
      { title: '6. Liên hệ', body: ['Liên hệ quyền riêng tư: support@somyung.cc', 'Đơn vị vận hành: HarmonyOn / Đại diện: Yohan Lee'] },
    ],
  },
  id: {
    title: 'Kebijakan Privasi',
    effectiveDate: '29 April 2026',
    updatedDate: '29 April 2026',
    intro: 'SoMyung adalah layanan analisis Saju untuk membantu orang tua atau wali memahami temperamen anak. Kebijakan ini menjelaskan data pribadi yang diproses, tujuannya, dan cara perlindungannya.',
    sections: [
      { title: '1. Data yang Kami Proses', table: { headers: ['Konteks', 'Data', 'Tujuan', 'Retensi'], rows: [['Pratinjau gratis', 'Nama anak, tanggal/jam lahir, gender, tempat lahir, peran orang tua dan data lahir orang tua', 'Membuat pratinjau temperamen', 'Tidak disimpan di database. Log infrastruktur/API sementara dapat tersimpan'], ['Laporan berbayar atau promo', 'Input pratinjau, email, data Saju yang dibuat, laporan AI, PDF', 'Membuat, menampilkan, mengirim, dan mendukung laporan', 'Disimpan terbatas untuk akses dan dukungan. Dihapus atas permintaan kecuali catatan yang wajib disimpan hukum'], ['Pembayaran', 'Email, data pesanan/persetujuan PayPal, status pembayaran, jumlah', 'Pemrosesan pembayaran, refund, pencatatan transaksi', 'Disimpan sesuai kebutuhan perdagangan, pajak, sengketa, dan audit'], ['Cookie analitik', 'Cookie/identifier Google Analytics', 'Analitik peningkatan layanan', 'Hanya digunakan setelah persetujuan']] } },
      { title: '2. Data Anak dan Peran Wali', body: ['Layanan ini ditujukan untuk orang tua atau wali, bukan untuk digunakan langsung oleh anak. Data anak hanya boleh dimasukkan oleh orang tua atau wali sah yang berwenang.'] },
      { title: '3. Pemrosesan Internasional dan Penyedia', body: ['Tanggal lahir, jam lahir, gender, tempat lahir, dan laporan yang dibuat diperlakukan sebagai data pribadi ketika terkait dengan anak atau keluarga.'], table: { headers: ['Penyedia', 'Wilayah', 'Data', 'Tujuan'], rows: [['Supabase', 'AS/global', 'Akun, laporan, data database terkait pembayaran', 'Database dan autentikasi'], ['AWS', 'Korea/global', 'Permintaan API dan data pemrosesan server', 'Eksekusi backend dan log'], ['Cloudflare', 'Global', 'Permintaan web, cache, log keamanan', 'Hosting dan keamanan situs'], ['OpenAI atau Google Gemini', 'AS/global', 'Data Saju minimum yang diperlukan untuk analisis', 'Pembuatan laporan AI'], ['PayPal', 'Global', 'Pembayar, pesanan, otorisasi, status pembayaran', 'Pemrosesan pembayaran'], ['Resend', 'AS/global', 'Email, konten email/PDF laporan', 'Pengiriman email'], ['Google Analytics', 'Global', 'Cookie, perangkat, event penggunaan', 'Analitik berbasis persetujuan']] } },
      { title: '4. Keamanan', bullets: ['Laporan dan PDF memerlukan token terbatas waktu dari server.', 'Konfirmasi pembayaran memerlukan PayPal order ID dan token pembayaran dari server.', 'Script analitik hanya dimuat setelah persetujuan cookie.'] },
      { title: '5. Hak Anda', body: ['Anda dapat meminta akses, koreksi, penghapusan, pembatasan pemrosesan, atau penarikan persetujuan melalui support@somyung.cc. Sebagian catatan pembayaran/transaksi mungkin wajib disimpan oleh hukum.'] },
      { title: '6. Kontak', body: ['Kontak privasi: support@somyung.cc', 'Operator: HarmonyOn / Perwakilan: Yohan Lee'] },
    ],
  },
  es: {
    title: 'Política de Privacidad',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '29 de abril de 2026',
    intro: 'SoMyung ayuda a padres y tutores a entender el temperamento de un niño mediante análisis Saju. Esta política explica qué datos personales se procesan, para qué se usan y cómo se protegen.',
    sections: [
      { title: '1. Datos que Procesamos', table: { headers: ['Contexto', 'Datos', 'Finalidad', 'Conservación'], rows: [['Vista previa gratuita', 'Apodo o nombre del niño, fecha/hora de nacimiento, género, lugar de nacimiento, rol y datos opcionales de nacimiento del padre/madre', 'Generar vista previa de temperamento', 'No se guarda en la base de datos. Puede haber logs temporales de infraestructura/API'], ['Informe pagado o promocional', 'Datos de entrada, email, datos Saju generados, informe AI, PDF', 'Generar, mostrar, entregar y dar soporte al informe', 'Conservación limitada para acceso y soporte. Eliminación bajo solicitud salvo registros legalmente necesarios'], ['Pago', 'Email, orden/autorización PayPal, estado, importe', 'Procesar pago, reembolsos, registros de transacción', 'Conservado según necesidades comerciales, fiscales, disputas y auditoría'], ['Cookies analíticas', 'Cookies/identificadores de Google Analytics', 'Mejora del servicio', 'Solo tras consentimiento']] } },
      { title: '2. Datos de Menores y Tutor', body: ['El servicio está dirigido a padres o tutores, no a niños que lo usen por su cuenta. Los datos de un niño solo deben ser ingresados por un padre, madre o tutor legal autorizado.'] },
      { title: '3. Procesamiento Internacional y Proveedores', body: ['Fecha de nacimiento, hora, género, lugar de nacimiento e informes generados se tratan como datos personales cuando se relacionan con un niño o una familia.'], table: { headers: ['Proveedor', 'Región', 'Datos', 'Finalidad'], rows: [['Supabase', 'EE. UU./global', 'Cuenta, informes, datos de base de datos relacionados con pagos', 'Base de datos y autenticación'], ['AWS', 'Corea/global', 'Solicitudes API y datos procesados por servidor', 'Backend y logs'], ['Cloudflare', 'Global', 'Solicitudes web, caché, logs de seguridad', 'Hosting y seguridad'], ['OpenAI o Google Gemini', 'EE. UU./global', 'Datos Saju mínimos necesarios para el análisis', 'Generación de informe AI'], ['PayPal', 'Global', 'Pagador, orden, autorización, estado de pago', 'Procesamiento de pagos'], ['Resend', 'EE. UU./global', 'Email, contenido/PDF del informe', 'Envío de email'], ['Google Analytics', 'Global', 'Cookies, dispositivo, eventos de uso', 'Analítica con consentimiento']] } },
      { title: '4. Seguridad', bullets: ['Informes y PDF requieren un token temporal emitido por el servidor.', 'La captura de pago requiere PayPal order ID y token de pago del servidor.', 'Los scripts analíticos cargan solo tras consentimiento de cookies.'] },
      { title: '5. Sus Derechos', body: ['Puede solicitar acceso, rectificación, eliminación, limitación o retirar consentimiento escribiendo a support@somyung.cc. Algunos registros de pago/transacción pueden conservarse por obligación legal.'] },
      { title: '6. Contacto', body: ['Contacto de privacidad: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    effectiveDate: '29 de abril de 2026',
    updatedDate: '29 de abril de 2026',
    intro: 'SoMyung ajuda pais e responsáveis a entender o temperamento de uma criança por meio de análise Saju. Esta política explica quais dados pessoais são processados, por quê e como são protegidos.',
    sections: [
      { title: '1. Dados que Processamos', table: { headers: ['Contexto', 'Dados', 'Finalidade', 'Retenção'], rows: [['Prévia gratuita', 'Nome da criança, data/hora de nascimento, gênero, local de nascimento, papel e dados de nascimento do responsável', 'Gerar prévia de temperamento', 'Não armazenado no banco de dados. Logs temporários de infraestrutura/API podem existir'], ['Relatório pago ou promocional', 'Entradas, email, dados Saju gerados, relatório AI, PDF', 'Gerar, exibir, entregar e dar suporte ao relatório', 'Retido de forma limitada para acesso e suporte. Excluído sob solicitação salvo registros exigidos por lei'], ['Pagamento', 'Email, pedido/autorização PayPal, status, valor', 'Processar pagamento, reembolso e registros de transação', 'Retido conforme necessidades comerciais, fiscais, disputas e auditoria'], ['Cookies analíticos', 'Cookies/identificadores Google Analytics', 'Melhoria do serviço', 'Usado somente após consentimento']] } },
      { title: '2. Dados de Crianças e Responsável', body: ['O serviço é destinado a pais ou responsáveis, não a crianças usando por conta própria. Dados de criança só devem ser inseridos por pai, mãe ou responsável legal autorizado.'] },
      { title: '3. Processamento Internacional e Fornecedores', body: ['Data/hora de nascimento, gênero, local de nascimento e relatórios gerados são tratados como dados pessoais quando relacionados a uma criança ou família.'], table: { headers: ['Fornecedor', 'Região', 'Dados', 'Finalidade'], rows: [['Supabase', 'EUA/global', 'Conta, relatórios, dados de banco relacionados a pagamentos', 'Banco de dados e autenticação'], ['AWS', 'Coreia/global', 'Requisições API e dados processados no servidor', 'Execução backend e logs'], ['Cloudflare', 'Global', 'Requisições web, cache, logs de segurança', 'Hospedagem e segurança'], ['OpenAI ou Google Gemini', 'EUA/global', 'Dados Saju mínimos necessários para análise', 'Geração de relatório AI'], ['PayPal', 'Global', 'Pagador, pedido, autorização, status', 'Processamento de pagamento'], ['Resend', 'EUA/global', 'Email, conteúdo/PDF do relatório', 'Envio de email'], ['Google Analytics', 'Global', 'Cookies, dispositivo, eventos de uso', 'Analytics com consentimento']] } },
      { title: '4. Segurança', bullets: ['Relatórios e PDFs exigem token temporário emitido pelo servidor.', 'Captura de pagamento exige PayPal order ID e token de pagamento do servidor.', 'Scripts analíticos carregam apenas após consentimento de cookies.'] },
      { title: '5. Seus Direitos', body: ['Você pode solicitar acesso, correção, exclusão, restrição ou retirar consentimento pelo email support@somyung.cc. Alguns registros de pagamento/transação podem ser retidos por obrigação legal.'] },
      { title: '6. Contato', body: ['Contato de privacidade: support@somyung.cc', 'Operador: HarmonyOn / Representante: Yohan Lee'] },
    ],
  },
  fr: {
    title: 'Politique de Confidentialité',
    effectiveDate: '29 avril 2026',
    updatedDate: '29 avril 2026',
    intro: 'SoMyung aide les parents et tuteurs à comprendre le tempérament d’un enfant grâce à l’analyse Saju. Cette politique explique les données personnelles traitées, les finalités et les protections.',
    sections: [
      { title: '1. Données Traitées', table: { headers: ['Contexte', 'Données', 'Finalité', 'Conservation'], rows: [['Aperçu gratuit', 'Nom de l’enfant, date/heure de naissance, genre, lieu de naissance, rôle et données de naissance du parent', 'Générer un aperçu du tempérament', 'Non stocké en base de données. Des logs temporaires d’infrastructure/API peuvent exister'], ['Rapport payant ou promotionnel', 'Données saisies, email, données Saju générées, rapport IA, PDF', 'Générer, afficher, livrer et soutenir le rapport', 'Conservation limitée pour accès et support. Suppression sur demande sauf obligations légales'], ['Paiement', 'Email, commande/autorisation PayPal, statut, montant', 'Paiement, remboursement, enregistrement de transaction', 'Conservé selon les besoins commerciaux, fiscaux, litiges et audit'], ['Cookies analytiques', 'Cookies/identifiants Google Analytics', 'Amélioration du service', 'Utilisés seulement après consentement']] } },
      { title: '2. Données d’Enfants et Tuteur', body: ['Le service s’adresse aux parents ou tuteurs, pas aux enfants l’utilisant seuls. Les données d’un enfant doivent être saisies uniquement par un parent ou tuteur légal autorisé.'] },
      { title: '3. Traitement International et Prestataires', body: ['Date/heure de naissance, genre, lieu de naissance et rapports générés sont traités comme données personnelles lorsqu’ils se rapportent à un enfant ou une famille.'], table: { headers: ['Prestataire', 'Région', 'Données', 'Finalité'], rows: [['Supabase', 'États-Unis/global', 'Compte, rapports, données DB liées aux paiements', 'Base de données et authentification'], ['AWS', 'Corée/global', 'Requêtes API et données serveur', 'Backend et logs'], ['Cloudflare', 'Global', 'Requêtes web, cache, logs sécurité', 'Hébergement et sécurité'], ['OpenAI ou Google Gemini', 'États-Unis/global', 'Données Saju minimales nécessaires à l’analyse', 'Génération de rapport IA'], ['PayPal', 'Global', 'Payeur, commande, autorisation, statut', 'Traitement du paiement'], ['Resend', 'États-Unis/global', 'Email, contenu/PDF du rapport', 'Envoi email'], ['Google Analytics', 'Global', 'Cookies, appareil, événements d’usage', 'Analyse avec consentement']] } },
      { title: '4. Sécurité', bullets: ['Les rapports et PDF nécessitent un token temporaire émis par le serveur.', 'La capture de paiement nécessite le PayPal order ID et un token de paiement serveur.', 'Les scripts analytiques chargent seulement après consentement cookies.'] },
      { title: '5. Vos Droits', body: ['Vous pouvez demander accès, rectification, suppression, limitation ou retrait du consentement via support@somyung.cc. Certains enregistrements de paiement/transaction peuvent être conservés légalement.'] },
      { title: '6. Contact', body: ['Contact confidentialité: support@somyung.cc', 'Opérateur: HarmonyOn / Représentant: Yohan Lee'] },
    ],
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    effectiveDate: '29 เมษายน 2026',
    updatedDate: '29 เมษายน 2026',
    intro: 'SoMyung เป็นบริการวิเคราะห์ Saju สำหรับพ่อแม่หรือผู้ปกครองเพื่อเข้าใจลักษณะนิสัยของเด็ก นโยบายนี้อธิบายข้อมูลส่วนบุคคลที่ประมวลผล วัตถุประสงค์ และการปกป้องข้อมูล',
    sections: [
      { title: '1. ข้อมูลที่เราประมวลผล', table: { headers: ['บริบท', 'ข้อมูล', 'วัตถุประสงค์', 'การเก็บรักษา'], rows: [['ตัวอย่างฟรี', 'ชื่อเด็ก วัน/เวลาเกิด เพศ สถานที่เกิด บทบาทและข้อมูลเกิดของผู้ปกครอง', 'สร้างตัวอย่างการวิเคราะห์นิสัย', 'ไม่บันทึกในฐานข้อมูล แต่อาจมี log ระบบ/API ชั่วคราว'], ['รายงานแบบชำระเงิน/โปรโมชัน', 'ข้อมูลที่กรอก อีเมล ข้อมูล Saju รายงาน AI และ PDF', 'สร้าง แสดง ส่ง และสนับสนุนรายงาน', 'เก็บระยะเวลาจำกัดเพื่อเข้าถึงและสนับสนุน ลบเมื่อร้องขอ ยกเว้นข้อมูลที่ต้องเก็บตามกฎหมาย'], ['การชำระเงิน', 'อีเมล ข้อมูลคำสั่งซื้อ/อนุมัติ PayPal สถานะและจำนวนเงิน', 'ประมวลผลการชำระเงิน คืนเงิน และบันทึกธุรกรรม', 'เก็บตามความจำเป็นด้านการค้า ภาษี ข้อพิพาท และตรวจสอบ'], ['คุกกี้วิเคราะห์', 'คุกกี้/ตัวระบุ Google Analytics', 'วิเคราะห์เพื่อปรับปรุงบริการ', 'ใช้เฉพาะเมื่อยินยอม']] } },
      { title: '2. ข้อมูลเด็กและผู้ปกครอง', body: ['บริการนี้มีไว้สำหรับพ่อแม่หรือผู้ปกครอง ไม่ใช่สำหรับเด็กใช้งานเอง ข้อมูลเด็กควรถูกกรอกโดยพ่อแม่หรือผู้ปกครองตามกฎหมายที่มีสิทธิ์เท่านั้น'] },
      { title: '3. การประมวลผลข้ามประเทศและผู้ให้บริการ', body: ['วันเกิด เวลาเกิด เพศ สถานที่เกิด และรายงานที่สร้างขึ้นถือเป็นข้อมูลส่วนบุคคลเมื่อเกี่ยวข้องกับเด็กหรือครอบครัว'], table: { headers: ['ผู้ให้บริการ', 'ภูมิภาค', 'ข้อมูล', 'วัตถุประสงค์'], rows: [['Supabase', 'สหรัฐฯ/ทั่วโลก', 'บัญชี รายงาน ข้อมูลฐานข้อมูลเกี่ยวกับการชำระเงิน', 'ฐานข้อมูลและการยืนยันตัวตน'], ['AWS', 'เกาหลี/ทั่วโลก', 'คำขอ API และข้อมูลประมวลผลบนเซิร์ฟเวอร์', 'รัน backend และ log'], ['Cloudflare', 'ทั่วโลก', 'คำขอเว็บ cache และ log ความปลอดภัย', 'โฮสติ้งและความปลอดภัย'], ['OpenAI หรือ Google Gemini', 'สหรัฐฯ/ทั่วโลก', 'ข้อมูล Saju ขั้นต่ำที่จำเป็นต่อการวิเคราะห์', 'สร้างรายงาน AI'], ['PayPal', 'ทั่วโลก', 'ผู้ชำระเงิน คำสั่งซื้อ การอนุมัติ สถานะ', 'ประมวลผลการชำระเงิน'], ['Resend', 'สหรัฐฯ/ทั่วโลก', 'อีเมล เนื้อหาอีเมล/PDF รายงาน', 'ส่งอีเมล'], ['Google Analytics', 'ทั่วโลก', 'คุกกี้ อุปกรณ์ เหตุการณ์การใช้งาน', 'วิเคราะห์ตามความยินยอม']] } },
      { title: '4. ความปลอดภัย', bullets: ['รายงานและ PDF ต้องใช้ token แบบจำกัดเวลาจากเซิร์ฟเวอร์', 'การยืนยันการชำระเงินต้องใช้ PayPal order ID และ token การชำระเงินจากเซิร์ฟเวอร์', 'สคริปต์วิเคราะห์โหลดหลังจากยินยอมคุกกี้เท่านั้น'] },
      { title: '5. สิทธิของคุณ', body: ['คุณสามารถขอเข้าถึง แก้ไข ลบ จำกัดการประมวลผล หรือถอนความยินยอมได้ที่ support@somyung.cc ข้อมูลธุรกรรมบางรายการอาจต้องเก็บตามกฎหมาย'] },
      { title: '6. ติดต่อ', body: ['ติดต่อเรื่องความเป็นส่วนตัว: support@somyung.cc', 'ผู้ดำเนินการ: HarmonyOn / ตัวแทน: Yohan Lee'] },
    ],
  },
}

const termsContent: Record<SupportedLegalLanguage, LegalPageContent> = {
  ko: {
    title: '이용약관',
    effectiveDate: '2026년 4월 29일',
    updatedDate: '2026년 4월 29일',
    intro: '본 약관은 SoMyung 서비스 이용 조건을 설명합니다.',
    sections: [
      { title: '1. 서비스 성격', body: ['SoMyung은 사주 명리학과 AI를 활용한 기질 분석 참고 자료를 제공합니다. 결과는 의사결정 보조 정보이며 의료, 법률, 재정, 심리치료 조언이 아닙니다.'] },
      { title: '2. 이용자 책임', bullets: ['정확한 정보를 입력해야 합니다.', '아동 정보는 부모 또는 법정대리인만 입력할 수 있습니다.', '결과를 중요한 결정의 유일한 근거로 사용하지 않아야 합니다.'] },
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
    updatedDate: 'April 29, 2026',
    intro: 'These terms explain how you may use SoMyung.',
    sections: [
      { title: '1. Nature of the Service', body: ['SoMyung provides temperament analysis using Saju and AI. Results are reference materials only and are not medical, legal, financial, psychological, or professional advice.'] },
      { title: '2. User Responsibilities', bullets: ['Provide accurate information.', 'Enter child data only if you are the parent or legal guardian with authority to do so.', 'Do not use the report as the sole basis for important decisions.'] },
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
    updatedDate: '2026年4月29日',
    intro: '本規約はSoMyungの利用条件を説明します。',
    sections: [
      { title: '1. サービスの性質', body: ['SoMyungはSajuとAIを用いた気質分析の参考資料を提供します。医療、法律、金融、心理治療その他の専門的助言ではありません。'] },
      { title: '2. 利用者の責任', bullets: ['正確な情報を入力してください。', 'お子様の情報は権限を持つ親または法定代理人のみ入力できます。', '重要な決定の唯一の根拠として利用しないでください。'] },
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
    updatedDate: '2026年4月29日',
    intro: '本条款说明您如何使用 SoMyung。',
    sections: [
      { title: '1. 服务性质', body: ['SoMyung 使用四柱和 AI 提供气质分析参考资料，不构成医疗、法律、财务、心理治疗或其他专业建议。'] },
      { title: '2. 用户责任', bullets: ['请提供准确的信息。', '儿童信息只能由有权的父母或法定监护人输入。', '请勿将报告作为重要决定的唯一依据。'] },
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
    updatedDate: '29/04/2026',
    intro: 'Các điều khoản này giải thích cách bạn có thể sử dụng SoMyung.',
    sections: [
      { title: '1. Bản chất dịch vụ', body: ['SoMyung cung cấp tài liệu tham khảo về khí chất bằng Saju và AI. Kết quả không phải là tư vấn y tế, pháp lý, tài chính, tâm lý trị liệu hoặc tư vấn chuyên môn.'] },
      { title: '2. Trách nhiệm người dùng', bullets: ['Cung cấp thông tin chính xác.', 'Chỉ nhập dữ liệu trẻ em nếu bạn là cha mẹ hoặc người giám hộ hợp pháp có thẩm quyền.', 'Không dùng báo cáo làm cơ sở duy nhất cho quyết định quan trọng.'] },
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
    updatedDate: '29 April 2026',
    intro: 'Ketentuan ini menjelaskan cara Anda menggunakan SoMyung.',
    sections: [
      { title: '1. Sifat Layanan', body: ['SoMyung menyediakan materi referensi analisis temperamen menggunakan Saju dan AI. Hasil bukan nasihat medis, hukum, keuangan, psikoterapi, atau profesional.'] },
      { title: '2. Tanggung Jawab Pengguna', bullets: ['Berikan informasi yang akurat.', 'Masukkan data anak hanya jika Anda orang tua atau wali sah yang berwenang.', 'Jangan gunakan laporan sebagai satu-satunya dasar keputusan penting.'] },
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
    updatedDate: '29 de abril de 2026',
    intro: 'Estos términos explican cómo puede usar SoMyung.',
    sections: [
      { title: '1. Naturaleza del Servicio', body: ['SoMyung ofrece material de referencia de análisis de temperamento usando Saju e IA. Los resultados no son asesoramiento médico, legal, financiero, psicológico ni profesional.'] },
      { title: '2. Responsabilidades del Usuario', bullets: ['Proporcione información precisa.', 'Ingrese datos de menores solo si es padre, madre o tutor legal autorizado.', 'No use el informe como única base para decisiones importantes.'] },
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
    updatedDate: '29 de abril de 2026',
    intro: 'Estes termos explicam como você pode usar o SoMyung.',
    sections: [
      { title: '1. Natureza do Serviço', body: ['SoMyung fornece material de referência de análise de temperamento usando Saju e IA. Os resultados não são aconselhamento médico, jurídico, financeiro, psicológico ou profissional.'] },
      { title: '2. Responsabilidades do Usuário', bullets: ['Forneça informações precisas.', 'Insira dados de criança apenas se você for pai, mãe ou responsável legal autorizado.', 'Não use o relatório como única base para decisões importantes.'] },
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
    updatedDate: '29 avril 2026',
    intro: 'Ces conditions expliquent comment utiliser SoMyung.',
    sections: [
      { title: '1. Nature du Service', body: ['SoMyung fournit un support de référence d’analyse du tempérament avec Saju et IA. Les résultats ne sont pas des conseils médicaux, juridiques, financiers, psychologiques ou professionnels.'] },
      { title: '2. Responsabilités de l’Utilisateur', bullets: ['Fournir des informations exactes.', 'Saisir les données d’un enfant uniquement si vous êtes parent ou tuteur légal autorisé.', 'Ne pas utiliser le rapport comme seule base de décisions importantes.'] },
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
    updatedDate: '29 เมษายน 2026',
    intro: 'ข้อกำหนดนี้อธิบายวิธีการใช้ SoMyung',
    sections: [
      { title: '1. ลักษณะของบริการ', body: ['SoMyung ให้ข้อมูลอ้างอิงการวิเคราะห์นิสัยด้วย Saju และ AI ผลลัพธ์ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย การเงิน จิตบำบัด หรือคำแนะนำวิชาชีพ'] },
      { title: '2. ความรับผิดชอบของผู้ใช้', bullets: ['ให้ข้อมูลที่ถูกต้อง', 'กรอกข้อมูลเด็กเฉพาะเมื่อคุณเป็นพ่อแม่หรือผู้ปกครองตามกฎหมายที่มีสิทธิ์', 'อย่าใช้รายงานเป็นเหตุผลเดียวในการตัดสินใจสำคัญ'] },
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
