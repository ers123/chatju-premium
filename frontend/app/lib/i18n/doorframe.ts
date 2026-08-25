import type { CSSProperties } from 'react'
import type { Language } from './translations'

/**
 * Doorframe redesign copy (docs/redesign-plan-doorframe.md §Phase 1/4).
 * Kept out of translations.ts so the 437KB file is touched once, in Phase 4.
 * All 10 languages authored (Phase 4). Unknown languages fall back to en.
 */
export interface DoorframeCopy {
  /** MARK n / 5 caption next to the logo */
  markOf: (n: number, total: number) => string
  /** E-question headline + sub per step (1–5) */
  q: { title: string; sub: string }[]
  /** rail labels */
  childFallback: string
  motherShort: string
  fatherShort: string
  familyLine: string
  /** pencil micro-notes */
  noteNameReady: (name: string) => string
  noteZodiac: (name: string, animal: string) => string
  noteHourPending: string
  noteHourSet: string
  noteParentMark: (who: string) => string
  noteFamilyDone: (name: string) => string
  /** buttons */
  drawNext: string
  drawLast: string
  /** casting overlay pillar names */
  pillars: [string, string, string, string]
  /** landing questions band (E-copy) */
  band: {
    floats: string[]
    title1: string
    titleAccent: string
    title2: string
    sub: string
  }
  /** hero journal note — a parent's late-night diary entry */
  journal: {
    date: string
    line1: string
    line2: string
    underline: string
    line3: string
    margin: string
  }
}

const ko: DoorframeCopy = {
  markOf: (n, total) => `눈금 ${n} / ${total}`,
  q: [
    { title: '누굴 닮은 걸까요 — 먼저, 이름부터', sub: '풀이에서 아이를 이름으로 부르기 위해서만 쓰고, 저장하지 않습니다.' },
    { title: '왜 그런 걸까요 — 태어난 날이 바탕입니다', sub: '기둥에 첫 눈금이 그어집니다.' },
    { title: '그 시각의 하늘까지', sub: '시각을 알면 네 번째 기둥, 시주까지 읽을 수 있어요. 몰라도 괜찮습니다.' },
    { title: '당신의 눈금도 함께 그어 볼까요', sub: '부모의 사주를 알면 아이와의 합까지 풀 수 있어요. 건너뛰어도 됩니다.' },
    { title: '이제 나란히 섰습니다', sub: '적은 내용을 확인하고, 동의만 남았어요.' },
  ],
  childFallback: '아이',
  motherShort: '엄마',
  fatherShort: '아빠',
  familyLine: '가족의 눈금',
  noteNameReady: (name) => `${name} — 좋은 이름이에요. 이제 이름으로 부를게요.`,
  noteZodiac: (name, animal) => `${animal} ${name} — 기둥에 첫 눈금이 준비됐어요`,
  noteHourPending: '시각을 넣으면 마지막 기둥이 밝혀져요',
  noteHourSet: '네 기둥이 모두 준비됐어요',
  noteParentMark: (who) => `${who}의 눈금이 아이 곁에 그어졌어요`,
  noteFamilyDone: (name) => `${name}의 곁에, 가족의 눈금이 나란히 섰어요`,
  drawNext: '눈금 긋고 다음으로',
  drawLast: '이제 풀이를 시작할게요',
  pillars: ['년주', '월주', '일주', '시주'],
  band: {
    floats: [
      '왜 이렇게 낯을 가릴까',
      '누굴 닮은 걸까',
      '혼자 노는 걸 좋아하는 게 괜찮은 걸까',
      '왜 한 가지에만 저렇게 빠져들까',
      '내가 잘 키우고 있는 걸까',
      '뭘 좋아하는 아이로 자랄까',
      '동생이랑은 왜 이렇게 다를까',
    ],
    title1: '아이에 대한 질문이 많다는 건,',
    titleAccent: '그만큼 깊이 보고 있다',
    title2: '는 뜻입니다',
    sub: '그 질문들에, 태어난 순간의 기록으로 답해 드립니다.',
  },
  journal: { date: '10월 3일, 밤 11시 40분', line1: '오늘도 블록이 무너지자 울지 않고', line2: '처음부터 다시 쌓았다.', underline: '이 고집은 대체 어디서 온 걸까.', line3: '나를 닮은 걸까, 원래 그런 걸까.', margin: '← 이 질문에 답해 드려요' },
}

const en: DoorframeCopy = {
  markOf: (n, total) => `Mark ${n} / ${total}`,
  q: [
    { title: 'Who do they take after? — First, a name', sub: 'Used only to call your child by name in the reading. Never stored.' },
    { title: 'Why are they like this? — It starts with their birth day', sub: 'The first mark goes on the doorframe.' },
    { title: 'Down to the hour of that sky', sub: 'With the hour we can read the fourth pillar. It is fine not to know.' },
    { title: 'Shall we draw your mark too?', sub: 'With a parent’s chart we can read your match with your child. You may skip this.' },
    { title: 'Now you stand side by side', sub: 'Check what you wrote — only consent remains.' },
  ],
  childFallback: 'child',
  motherShort: 'Mom',
  fatherShort: 'Dad',
  familyLine: 'family marks',
  noteNameReady: (name) => `${name} — a lovely name. We’ll use it from here.`,
  noteZodiac: (name, animal) => `${animal} ${name} — the first mark is ready`,
  noteHourPending: 'Add the hour to light the last pillar',
  noteHourSet: 'All four pillars are ready',
  noteParentMark: (who) => `${who}’s mark now sits beside your child’s`,
  noteFamilyDone: (name) => `Beside ${name}, the family’s marks stand together`,
  drawNext: 'Draw the mark, continue',
  drawLast: 'Begin the reading',
  pillars: ['Year', 'Month', 'Day', 'Hour'],
  band: {
    floats: [
      'Why so shy with strangers?',
      'Who do they take after?',
      'Is it okay that they love playing alone?',
      'Why do they fixate on one thing?',
      'Am I raising them well?',
      'What will they grow to love?',
      'Why are they so different from their sibling?',
    ],
    title1: 'Having many questions about your child means',
    titleAccent: 'you are watching them closely',
    title2: '',
    sub: 'We answer those questions with the record of the moment they were born.',
  },
  journal: { date: 'Oct 3, 11:40 pm', line1: 'The blocks fell again tonight.', line2: 'No tears — she just rebuilt them.', underline: 'Where does this stubbornness come from?', line3: 'Is it me in her, or just who she is?', margin: '← we answer this question' },
}


const ja: DoorframeCopy = {
  markOf: (n, total) => `目盛り ${n} / ${total}`,
  q: [
    { title: '誰に似たんだろう — まず、お名前から', sub: '呼びかけにお名前を使うだけで、保存はしません。' },
    { title: 'どうしてこうなんだろう — 生まれた日が土台です', sub: '柱に最初の目盛りがつきます。' },
    { title: 'その時刻の空まで', sub: '時刻がわかれば、四本目の柱「時柱」まで読めます。わからなくても大丈夫です。' },
    { title: 'あなたの目盛りも一緒に刻みましょうか', sub: '親の四柱がわかれば、お子さんとの相性まで読めます。飛ばしても構いません。' },
    { title: '柱の前に、並んで立ちました', sub: '書いた内容を確認して、あとは同意だけです。' },
  ],
  childFallback: 'お子さん',
  motherShort: 'ママ',
  fatherShort: 'パパ',
  familyLine: '家族の背くらべ',
  noteNameReady: (name) => `${name} — 素敵なお名前ですね。これからお名前で呼びます。`,
  noteZodiac: (name, animal) => `${animal}の${name} — 最初の目盛りの準備ができました`,
  noteHourPending: '時刻を入れると、最後の柱が明らかになります',
  noteHourSet: '四つの柱がすべて揃いました',
  noteParentMark: (who) => `${who}の目盛りが、お子さんの隣に刻まれました`,
  noteFamilyDone: (name) => `${name}の隣に、家族の目盛りが並んで立ちました`,
  drawNext: '目盛りを刻んで次へ',
  drawLast: 'さあ、読み解きを始めます',
  pillars: ['年柱', '月柱', '日柱', '時柱'],
  band: {
    floats: [
      'どうしてこんなに人見知りなんだろう',
      '誰に似たんだろう',
      '一人遊びが好きなのは、このままでいいのかな',
      'どうして一つのことにこんなに夢中になるんだろう',
      '私はちゃんと育てられているのかな',
      'この子は将来、何が好きになるんだろう',
      '兄弟なのに、どうしてこんなに違うんだろう',
    ],
    title1: 'お子さんへの疑問が多いのは、',
    titleAccent: 'それだけ深く見つめている',
    title2: 'ということです',
    sub: 'その問いに、生まれた瞬間の記録でお答えします。',
  },
  journal: { date: '10月3日、夜11時40分', line1: '積み木が崩れても泣かず', line2: '黙ってまた積み直した。', underline: 'この頑固さはどこから来たんだろう。', line3: '私に似たのか、生まれつきなのか。', margin: '← この問いにお答えします' },
}

const zh: DoorframeCopy = {
  markOf: (n, total) => `刻度 ${n} / ${total}`,
  q: [
    { title: '像谁呢 — 先从名字开始', sub: '仅用于在解读中称呼孩子的名字，不会被保存。' },
    { title: '为什么会这样呢 — 从出生的那天说起', sub: '门框上画下第一道刻度。' },
    { title: '连那一刻的天空也算进来', sub: '知道出生时辰，就能读到第四根柱子——时柱。不知道也没关系。' },
    { title: '要不要也画上你的刻度', sub: '知道父母的八字，还能读出和孩子的缘分。可以跳过这一步。' },
    { title: '现在，你们并肩站在一起了', sub: '确认一下填写的内容，只剩下同意了。' },
  ],
  childFallback: '孩子',
  motherShort: '妈妈',
  fatherShort: '爸爸',
  familyLine: '家人的刻度',
  noteNameReady: (name) => `${name} — 真是个好名字，接下来就用这个名字称呼。`,
  noteZodiac: (name, animal) => `${animal}${name} — 第一道刻度已经准备好了`,
  noteHourPending: '填上时辰，第四根柱子就能显现',
  noteHourSet: '四根柱子都准备好了',
  noteParentMark: (who) => `${who}的刻度，已经画在孩子身旁`,
  noteFamilyDone: (name) => `${name}身旁，一家人的刻度并肩而立`,
  drawNext: '画下刻度，继续',
  drawLast: '现在开始解读',
  pillars: ['年柱', '月柱', '日柱', '时柱'],
  band: {
    floats: [
      '为什么这么怕生人',
      '这孩子像谁呢',
      '喜欢一个人玩，真的没关系吗',
      '为什么会这么专注于一件事',
      '我这样带孩子，算是带对了吗',
      '长大后会喜欢什么呢',
      '明明是兄弟姐妹，怎么差别这么大',
    ],
    title1: '对孩子有很多疑问，',
    titleAccent: '正说明你看得够深',
    title2: '',
    sub: '我们用孩子出生那一刻的记录，回答这些问题。',
  },
  journal: { date: '10月3日 深夜11:40', line1: '积木倒了，他没哭，', line2: '默默地又搭了起来。', underline: '这股倔强到底从哪来的？', line3: '是像我，还是他本来就这样？', margin: '← 我们来回答这个问题' },
}

const vi: DoorframeCopy = {
  markOf: (n, total) => `Vạch ${n} / ${total}`,
  q: [
    { title: 'Con giống ai nhỉ — trước tiên, cho biết tên con', sub: 'Chỉ dùng để gọi tên con trong lời giải, không lưu lại.' },
    { title: 'Sao con lại thế này nhỉ — bắt đầu từ ngày sinh', sub: 'Vạch đầu tiên được ghi lên.' },
    { title: 'Đến cả giờ khắc bầu trời lúc đó', sub: 'Biết giờ sinh, có thể đọc được trụ thứ tư. Không biết cũng không sao.' },
    { title: 'Ghi luôn vạch của ba mẹ nhé', sub: 'Biết ngày sinh của ba mẹ, có thể xem thêm sự hợp giữa ba mẹ và con. Có thể bỏ qua bước này.' },
    { title: 'Giờ thì đã đứng cạnh nhau rồi', sub: 'Kiểm tra lại những gì đã nhập, chỉ còn việc đồng ý thôi.' },
  ],
  childFallback: 'con',
  motherShort: 'Mẹ',
  fatherShort: 'Bố',
  familyLine: 'vạch của cả nhà',
  noteNameReady: (name) => `${name} — một cái tên thật đẹp. Từ giờ mình sẽ gọi con như vậy.`,
  noteZodiac: (name, animal) => `${animal} ${name} — vạch đầu tiên đã sẵn sàng`,
  noteHourPending: 'Thêm giờ sinh để hoàn thiện trụ cuối cùng',
  noteHourSet: 'Cả bốn trụ đã sẵn sàng',
  noteParentMark: (who) => `Vạch của ${who} đã được ghi bên cạnh con`,
  noteFamilyDone: (name) => `Bên cạnh ${name}, vạch của cả nhà đã đứng cùng nhau`,
  drawNext: 'Ghi vạch, tiếp tục',
  drawLast: 'Bắt đầu xem lời giải',
  pillars: ['Trụ năm', 'Trụ tháng', 'Trụ ngày', 'Trụ giờ'],
  band: {
    floats: [
      'Sao con lại nhút nhát với người lạ thế nhỉ',
      'Con giống ai nhỉ',
      'Con thích chơi một mình, vậy có ổn không',
      'Sao con lại mê mẩn một thứ đến vậy',
      'Mình nuôi con vậy đã đúng cách chưa',
      'Sau này con sẽ thích điều gì nhỉ',
      'Sao anh chị em mà lại khác nhau đến thế',
    ],
    title1: 'Có nhiều câu hỏi về con,',
    titleAccent: 'nghĩa là bạn đang nhìn con thật sâu',
    title2: '',
    sub: 'Chúng tôi trả lời những câu hỏi đó bằng chính khoảnh khắc con chào đời.',
  },
  journal: { date: '3/10, 11:40 tối', line1: 'Tháp gỗ đổ, con không khóc,', line2: 'lặng lẽ xếp lại từ đầu.', underline: 'Cái bướng bỉnh này từ đâu ra vậy?', line3: 'Giống mình, hay vốn dĩ con đã vậy?', margin: '← câu trả lời có ở đây' },
}

const id: DoorframeCopy = {
  markOf: (n, total) => `Tanda ke-${n} / ${total}`,
  q: [
    { title: 'Mirip siapa, ya — dulu, nama dulu', sub: 'Hanya dipakai untuk memanggil nama anak dalam pembacaan, tidak disimpan.' },
    { title: 'Kenapa dia begini, ya — semua berawal dari hari lahirnya', sub: 'Tanda pertama pun tergores.' },
    { title: 'Sampai ke jam langit saat itu', sub: 'Kalau tahu jam lahirnya, kita bisa membaca pilar keempat. Tidak tahu pun tidak apa-apa.' },
    { title: 'Mau sekalian goreskan tanda Ayah/Bunda?', sub: 'Dengan data kelahiran orang tua, kecocokan dengan anak juga bisa dibaca. Boleh dilewati.' },
    { title: 'Sekarang kalian berdiri berdampingan', sub: 'Periksa kembali yang sudah diisi — tinggal persetujuan saja.' },
  ],
  childFallback: 'anak',
  motherShort: 'Bunda',
  fatherShort: 'Ayah',
  familyLine: 'tanda keluarga',
  noteNameReady: (name) => `${name} — nama yang indah. Mulai sekarang kami panggil begitu.`,
  noteZodiac: (name, animal) => `${animal} ${name} — tanda pertama sudah siap`,
  noteHourPending: 'Isi jam lahir untuk menyalakan pilar terakhir',
  noteHourSet: 'Keempat pilar sudah siap',
  noteParentMark: (who) => `Tanda ${who} kini berdiri di samping tanda anak`,
  noteFamilyDone: (name) => `Di samping ${name}, tanda seluruh keluarga kini berdiri berdampingan`,
  drawNext: 'Goreskan tanda, lanjutkan',
  drawLast: 'Mulai pembacaan',
  pillars: ['Pilar Tahun', 'Pilar Bulan', 'Pilar Hari', 'Pilar Jam'],
  band: {
    floats: [
      'Kenapa ya dia pemalu sekali sama orang baru',
      'Mirip siapa, ya, anak ini',
      'Apa boleh dia lebih suka main sendiri',
      'Kenapa dia bisa asyik banget sama satu hal saja',
      'Sudah benarkah cara aku membesarkannya',
      'Nanti dia akan suka apa, ya',
      'Kenapa dia beda banget sama kakak/adiknya',
    ],
    title1: 'Banyak pertanyaan tentang anak berarti',
    titleAccent: 'kamu memperhatikannya sedalam itu',
    title2: '',
    sub: 'Kami menjawab pertanyaan itu dengan catatan saat ia dilahirkan.',
  },
  journal: { date: '3 Okt, 23.40', line1: 'Menaranya roboh lagi malam ini.', line2: 'Tanpa nangis, ia susun ulang sendiri.', underline: 'Dari mana ya keras kepala ini?', line3: 'Menurun dariku, atau memang bawaannya?', margin: '← jawabannya ada di sini' },
}

const es: DoorframeCopy = {
  markOf: (n, total) => `Marca ${n} / ${total}`,
  q: [
    { title: '¿A quién habrá salido? — Primero, su nombre', sub: 'Solo se usa para llamar a tu hijo por su nombre en la lectura. No se guarda.' },
    { title: '¿Por qué será así? — Todo empieza el día que nació', sub: 'Se traza la primera marca en el marco.' },
    { title: 'Hasta el cielo de esa hora exacta', sub: 'Con la hora podemos leer el cuarto pilar. No pasa nada si no la sabes.' },
    { title: '¿Trazamos también tu marca?', sub: 'Con la carta de un padre o madre podemos leer la compatibilidad con tu hijo. Puedes saltarte este paso.' },
    { title: 'Ahora están el uno junto al otro', sub: 'Revisa lo que escribiste — solo falta tu consentimiento.' },
  ],
  childFallback: 'tu hijo',
  motherShort: 'Mamá',
  fatherShort: 'Papá',
  familyLine: 'las marcas de la familia',
  noteNameReady: (name) => `${name} — qué nombre tan bonito. A partir de ahora lo usaremos.`,
  noteZodiac: (name, animal) => `${animal} ${name} — la primera marca ya está lista`,
  noteHourPending: 'Agrega la hora para revelar el último pilar',
  noteHourSet: 'Los cuatro pilares ya están listos',
  noteParentMark: (who) => `La marca de ${who} ya está junto a la de tu hijo`,
  noteFamilyDone: (name) => `Junto a ${name}, las marcas de toda la familia quedan una al lado de la otra`,
  drawNext: 'Trazar la marca y continuar',
  drawLast: 'Comenzar la lectura',
  pillars: ['Año', 'Mes', 'Día', 'Hora'],
  band: {
    floats: [
      '¿Por qué es tan tímido con los desconocidos?',
      '¿A quién habrá salido?',
      '¿Está bien que le guste tanto jugar solo?',
      '¿Por qué se obsesiona tanto con una sola cosa?',
      '¿Lo estaré criando bien?',
      '¿Qué le terminará gustando de grande?',
      '¿Por qué es tan distinto de su hermano?',
    ],
    title1: 'Tener tantas preguntas sobre tu hijo significa que',
    titleAccent: 'lo estás observando de cerca',
    title2: '',
    sub: 'Respondemos esas preguntas con el registro del momento en que nació.',
  },
  journal: { date: '3 de oct, 11:40 pm', line1: 'Se cayeron los bloques otra vez.', line2: 'Sin llorar, los volvió a apilar.', underline: '¿De dónde sacó esta terquedad?', line3: '¿Se parece a mí, o es solo así?', margin: '← aquí respondemos eso' },
}

const pt: DoorframeCopy = {
  markOf: (n, total) => `Marca ${n} / ${total}`,
  q: [
    { title: 'Com quem ele se parece? — Primeiro, o nome', sub: 'Usado só para chamar seu filho pelo nome na leitura. Não é guardado.' },
    { title: 'Por que ele é assim? — Tudo começa no dia em que nasceu', sub: 'A primeira marca é riscada no batente.' },
    { title: 'Até o céu daquela hora exata', sub: 'Com a hora, conseguimos ler o quarto pilar. Não sabe? Sem problema.' },
    { title: 'Vamos riscar sua marca também?', sub: 'Com o mapa dos pais, dá pra ler a sintonia com seu filho. Pode pular essa etapa.' },
    { title: 'Agora vocês estão lado a lado', sub: 'Confira o que você escreveu — só falta o consentimento.' },
  ],
  childFallback: 'seu filho',
  motherShort: 'Mãe',
  fatherShort: 'Pai',
  familyLine: 'marcas da família',
  noteNameReady: (name) => `${name} — que nome lindo. A partir de agora vamos usá-lo.`,
  noteZodiac: (name, animal) => `${animal} ${name} — a primeira marca já está pronta`,
  noteHourPending: 'Adicione a hora para revelar o último pilar',
  noteHourSet: 'Os quatro pilares já estão prontos',
  noteParentMark: (who) => `A marca de ${who} já está ao lado da do seu filho`,
  noteFamilyDone: (name) => `Ao lado de ${name}, as marcas de toda a família ficam lado a lado`,
  drawNext: 'Riscar a marca e continuar',
  drawLast: 'Começar a leitura',
  pillars: ['Ano', 'Mês', 'Dia', 'Hora'],
  band: {
    floats: [
      'Por que ele é tão tímido com estranhos?',
      'Com quem ele se parece?',
      'Tudo bem ele gostar tanto de brincar sozinho?',
      'Por que ele se prende tanto a uma coisa só?',
      'Será que estou criando ele do jeito certo?',
      'No que ele vai gostar de se tornar?',
      'Por que ele é tão diferente do irmão?',
    ],
    title1: 'Ter tantas perguntas sobre seu filho significa que',
    titleAccent: 'você está olhando fundo pra ele',
    title2: '',
    sub: 'Respondemos essas perguntas com o registro do momento em que ele nasceu.',
  },
  journal: { date: '3 de out, 23h40', line1: 'A torre caiu de novo hoje.', line2: 'Sem chorar, ela montou tudo outra vez.', underline: 'De onde vem essa teimosia?', line3: 'Puxou a mim, ou já nasceu assim?', margin: '← a resposta está aqui' },
}

const fr: DoorframeCopy = {
  markOf: (n, total) => `Repère ${n} / ${total}`,
  q: [
    { title: 'À qui ressemble-t-il ? — D’abord, son prénom', sub: 'Utilisé uniquement pour appeler votre enfant par son prénom dans la lecture. Jamais conservé.' },
    { title: 'Pourquoi est-il comme ça ? — Tout commence le jour de sa naissance', sub: 'Le premier repère est tracé sur le chambranle.' },
    { title: 'Jusqu’au ciel de cette heure précise', sub: 'Avec l’heure, on peut lire le quatrième pilier. Ce n’est pas grave si vous ne la connaissez pas.' },
    { title: 'On trace votre repère aussi ?', sub: 'Avec le thème d’un parent, on peut lire l’harmonie avec votre enfant. Vous pouvez passer cette étape.' },
    { title: 'Vous voilà maintenant côte à côte', sub: 'Vérifiez ce que vous avez écrit — il ne reste plus que le consentement.' },
  ],
  childFallback: 'votre enfant',
  motherShort: 'Maman',
  fatherShort: 'Papa',
  familyLine: 'les repères de la famille',
  noteNameReady: (name) => `${name} — quel joli prénom. Nous l’utiliserons désormais.`,
  noteZodiac: (name, animal) => `${animal} ${name} — le premier repère est prêt`,
  noteHourPending: 'Ajoutez l’heure pour révéler le dernier pilier',
  noteHourSet: 'Les quatre piliers sont prêts',
  noteParentMark: (who) => `Le repère de ${who} se trouve maintenant à côté de celui de votre enfant`,
  noteFamilyDone: (name) => `À côté de ${name}, les repères de toute la famille se tiennent côte à côte`,
  drawNext: 'Tracer le repère, continuer',
  drawLast: 'Commencer la lecture',
  pillars: ['Année', 'Mois', 'Jour', 'Heure'],
  band: {
    floats: [
      'Pourquoi est-il si timide avec les inconnus ?',
      'À qui ressemble-t-il ?',
      'Est-ce normal qu’il aime tant jouer seul ?',
      'Pourquoi se passionne-t-il autant pour une seule chose ?',
      'Est-ce que je l’élève bien ?',
      'Qu’aimera-t-il en grandissant ?',
      'Pourquoi est-il si différent de son frère ou de sa sœur ?',
    ],
    title1: 'Avoir tant de questions sur son enfant, c’est',
    titleAccent: 'le regarder d’aussi près',
    title2: '',
    sub: 'Nous répondons à ces questions avec la trace du moment de sa naissance.',
  },
  journal: { date: '3 oct, 23h40', line1: 'La tour est encore tombée ce soir.', line2: "Sans pleurer, elle l'a reconstruite.", underline: "D'où lui vient cette obstination ?", line3: "Elle me ressemble, ou c'est juste elle ?", margin: '← on répond à cette question' },
}

const th: DoorframeCopy = {
  markOf: (n, total) => `รอยขีดที่ ${n} / ${total}`,
  q: [
    { title: 'ลูกเหมือนใครนะ — เริ่มจากชื่อลูกก่อน', sub: 'ใช้เรียกชื่อลูกในคำทำนายเท่านั้น ไม่มีการเก็บข้อมูลไว้' },
    { title: 'ทำไมลูกถึงเป็นแบบนี้นะ — เริ่มต้นจากวันเกิด', sub: 'รอยขีดแรกถูกขีดลงบนวงกบประตู' },
    { title: 'ไปจนถึงท้องฟ้าในชั่วโมงนั้น', sub: 'ถ้ารู้เวลาเกิด จะอ่านเสาหลักที่สี่ได้ด้วย ไม่รู้ก็ไม่เป็นไร' },
    { title: 'ขีดรอยของคุณไว้ด้วยกันไหม', sub: 'ถ้ารู้ดวงของพ่อแม่ จะดูความเข้ากันกับลูกได้ด้วย ข้ามขั้นตอนนี้ได้' },
    { title: 'ตอนนี้ยืนเคียงข้างกันแล้ว', sub: 'ตรวจสอบสิ่งที่กรอกไว้อีกครั้ง เหลือแค่การยินยอมเท่านั้น' },
  ],
  childFallback: 'ลูก',
  motherShort: 'แม่',
  fatherShort: 'พ่อ',
  familyLine: 'รอยขีดของครอบครัว',
  noteNameReady: (name) => `${name} — ชื่อเพราะมากค่ะ ต่อจากนี้จะเรียกชื่อนี้`,
  noteZodiac: (name, animal) => `${animal} ${name} — รอยขีดแรกพร้อมแล้ว`,
  noteHourPending: 'เติมเวลาเกิดเพื่อเปิดเสาหลักสุดท้าย',
  noteHourSet: 'เสาหลักทั้งสี่พร้อมแล้ว',
  noteParentMark: (who) => `รอยขีดของ${who}อยู่ข้างๆ ลูกแล้ว`,
  noteFamilyDone: (name) => `ข้างๆ ${name} รอยขีดของทั้งครอบครัวยืนเรียงกัน`,
  drawNext: 'ขีดรอยแล้วไปต่อ',
  drawLast: 'เริ่มอ่านคำทำนาย',
  pillars: ['เสาปี', 'เสาเดือน', 'เสาวัน', 'เสาเวลา'],
  band: {
    floats: [
      'ทำไมลูกถึงขี้อายกับคนแปลกหน้าจัง',
      'ลูกเหมือนใครนะ',
      'ลูกชอบเล่นคนเดียว แบบนี้โอเคไหม',
      'ทำไมลูกถึงหมกมุ่นกับสิ่งเดียวได้ขนาดนี้',
      'เราเลี้ยงลูกมาถูกทางไหมนะ',
      'โตขึ้นลูกจะชอบอะไรนะ',
      'ทำไมลูกถึงต่างจากพี่น้องขนาดนี้',
    ],
    title1: 'การมีคำถามมากมายเกี่ยวกับลูก หมายความว่า',
    titleAccent: 'คุณกำลังมองลูกอย่างลึกซึ้ง',
    title2: '',
    sub: 'เราตอบคำถามเหล่านั้นด้วยบันทึกช่วงเวลาที่ลูกลืมตาดูโลก',
  },
  journal: { date: '3 ต.ค. 23:40 น.', line1: 'ตึกบล็อกล้มอีกแล้วคืนนี้', line2: 'ไม่ร้องไห้ แค่ค่อยๆ ต่อใหม่', underline: 'ความดื้อแบบนี้มาจากไหนกันนะ', line3: 'เหมือนแม่ หรือเป็นแบบนี้อยู่แล้ว', margin: '← เราตอบคำถามนี้ให้คุณ' },
}

const byLang: Partial<Record<Language, DoorframeCopy>> = { ko, en, ja, zh, vi, id, es, pt, fr, th }

export function doorframeCopy(lang: Language): DoorframeCopy {
  return byLang[lang] ?? en
}

/**
 * Pencil-role handwriting font per language. Families chosen for verified
 * full-script coverage on Google Fonts (see globals.css import comment).
 * Applied by setting the --df-font-pencil custom property on a subtree.
 */
const pencilFonts: Partial<Record<Language, string>> = {
  ko: "'Gaegu', cursive",
  ja: "'Yomogi', cursive",
  zh: "'Long Cang', cursive",
  th: "'Mali', cursive",
  vi: "'Patrick Hand', cursive",
}
const latinPencil = "'Caveat', 'Patrick Hand', cursive"

export function pencilFontFor(lang: Language): string {
  return pencilFonts[lang] ?? latinPencil
}

/** Spread onto a container's style to re-point every df pencil element below it. */
export function pencilFontStyle(lang: Language): CSSProperties {
  return { ['--df-font-pencil' as string]: pencilFontFor(lang) } as CSSProperties
}
