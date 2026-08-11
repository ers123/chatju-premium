// 오행별 "상처가 되는 말 → 대신할 말"의 언어별 저작본
//
// 왜 번역이 아니라 저작인가
// ---------------------------------
// parent-child.js의 HARMFUL_PHRASES는 따옴표 친 한국어 부모 대사다. 비한국어
// 리포트에서 이 대사는 모델이 즉석에서 옮겨야 하는 부담이 되고, 측정해 보니
// (2026-08-11, output/localization/) 그 부담 아래에서 모델은 대사를 통째로 버리고
// 일반 육아 조언으로 대체했다. 근거 보존율 ko 75~100% vs fr 50~64%로, 두 심판이
// 공통으로 지목한 손실 지점이 정확히 이 "피할 말 3종 / 대신할 말 3종"이었다.
//
// 프롬프트로 "번역하지 말고 기능만 옮겨라"라고 지시해 봤으나 효과가 0이었다
// (동일 심판 비교에서 10/2/1 대 10/2/1로 완전히 동일). progress_2026-08-11.md
// §9.2가 경고한 대로 형식·문구를 프롬프트 지시로 강제하는 레버는 이 파이프라인에서
// 작동하지 않는다. 그래서 데이터로 박는다.
//
// 저작 원칙
// ---------------------------------
// - 한국어 문장의 번역이 아니라, 같은 기능을 하는 그 나라 부모의 실제 말을 쓴다.
//   («형은 안 그랬는데» → « Ton frère, lui, il n'en faisait pas toute une histoire. »)
// - avoid는 그 문화권 부모가 실제로 무심코 내뱉는 말이어야 한다. 교과서 문장이면
//   부모가 자기 모습을 못 알아본다.
// - instead는 부모가 그대로 소리 내어 읽을 수 있는 길이여야 한다.
// - why(왜 상처가 되는지)는 분석이라 원본 한국어를 그대로 쓴다. 모델이 근거로만
//   삼고 출력에는 옮기지 않는다.
//
// 새 언어를 추가할 때는 그 언어를 모어로 쓰는 사람이 avoid 문장을 읽고 "우리 엄마가
// 하는 말"이라고 느끼는지부터 확인할 것. 그 감각이 없으면 번역본이다.

const HARMFUL_PHRASES_I18N = {
  ja: {
    // avoid는 親がつい口にする実際の言い方、instead は誘いかけ形。
    // 命令形を避け、褒めは控えめ・具体的に(cultural-register.js の ja 参照)。
    '목': [
      {
        avoid: '「いつも始めるだけで、最後までやらないよね。」',
        instead: '「今回はどこまでやってみる？　そこまでで終わりにしていいよ。」',
      },
      {
        avoid: '「あなたに何がわかるの。」',
        instead: '「そう思ってるんだね。お母さんはちょっと違うんだけど、理由きいてくれる？」',
      },
      {
        avoid: '「お兄ちゃんはこんなことなかったのに。」',
        instead: '「これは難しかったんだよね。どこで詰まったか教えてくれる？」',
      },
    ],
    '화': [
      {
        avoid: '「ちょっと静かにして。」',
        instead: '「全部聞きたいから、これだけ終わらせるね。五分だけ待ってくれる？」',
      },
      {
        avoid: '「どうせまたすぐ飽きるでしょ。」',
        instead: '「今はこれが一番楽しいんだね。いつまでやるか一緒に決めてみようか。」',
      },
      {
        avoid: '「そんなことでどうしてそんなに怒るの。」',
        instead: '「すごく悔しかったんだね。最初から話してくれる？」',
      },
    ],
    '토': [
      {
        avoid: '「どうしてそんなに遅いの。」',
        instead: '「準備できたら教えてね。どれくらいかかるかだけ言ってくれたら待つよ。」',
      },
      {
        avoid: '「自分の意見はないの。」',
        instead: '「三つのうちどれがいい？　今決めなくていいから、思いついたら教えてね。」',
      },
      {
        avoid: '「もう気にしないで。」',
        instead: '「まだ心に残ってるんだね。どこが一番ひっかかってる？」',
      },
    ],
    '금': [
      {
        avoid: '「そこまで細かく言わなくてもいいでしょ。」',
        instead: '「あなたの中では納得できてないんだね。どうなったら納得できそう？」',
      },
      {
        avoid: '「完璧じゃなくていいから、適当でいいよ。」',
        instead: '「ここまでで十分よくできてると思うよ。あなたから見て、まだ気になるところある？」',
      },
      {
        avoid: '「もう少し融通きかせなさい。」',
        instead: '「今回は例外にしてもいい場面だと思うんだけど、どう思う？」',
      },
    ],
    '수': [
      {
        avoid: '「考えてないで、まず動きなさい。」',
        instead: '「頭の中で整理してるところだよね。今までまとまった分だけ教えてくれる？」',
      },
      {
        avoid: '「何を考えてるのか、さっぱりわからない。」',
        instead: '「言葉にしにくかったら、あとで書いて渡してくれてもいいよ。急がないから。」',
      },
      {
        avoid: '「どうしてお友だちと遊ばないの。」',
        instead: '「今日はひとりでいたい日？　部屋にいてもいいよ。」',
      },
    ],
  },
  fr: {
    '목': [
      {
        avoid: '« Tu commences tout et tu ne finis jamais rien. »',
        instead: '« Tu veux aller jusqu\'où, cette fois ? On s\'arrête là et c\'est très bien comme ça. »',
      },
      {
        avoid: '« Qu\'est-ce que tu en sais, toi ? »',
        instead: '« D\'accord, toi tu le vois comme ça. Moi je le vois autrement — je t\'explique pourquoi ? »',
      },
      {
        avoid: '« Ton frère, lui, il n\'en faisait pas toute une histoire. »',
        instead: '« Ça, c\'était compliqué pour toi. Tu me montres où ça a coincé ? »',
      },
    ],
    '화': [
      {
        avoid: '« Bon, ça suffit, deux minutes de calme. »',
        instead: '« Je veux tout entendre, promis. Je finis ça et je suis à toi dans cinq minutes. »',
      },
      {
        avoid: '« De toute façon, dans quinze jours tu n\'y toucheras plus. »',
        instead: '« C\'est ça qui te passionne en ce moment. On décide ensemble jusqu\'à quand tu t\'y tiens ? »',
      },
      {
        avoid: '« Tu ne vas pas en faire tout un drame. »',
        instead: '« Ça t\'a vraiment contrarié. Raconte-moi depuis le début. »',
      },
    ],
    '토': [
      {
        avoid: '« Mais qu\'est-ce que tu es lent ! »',
        instead: '« Préviens-moi quand tu es prêt. Dis-moi juste combien de temps il te faut, j\'attends. »',
      },
      {
        avoid: '« Tu n\'as jamais d\'avis, toi. »',
        instead: '« Lequel des trois te va le mieux ? Tu n\'es pas obligé de choisir maintenant, dis-le-moi quand tu sauras. »',
      },
      {
        avoid: '« Arrête, laisse tomber. »',
        instead: '« Ça te reste encore en travers. C\'est quoi qui te gêne le plus ? »',
      },
    ],
    '금': [
      {
        avoid: '« Tu chipotes vraiment pour rien. »',
        instead: '« Pour toi ce n\'est pas juste. Qu\'est-ce qu\'il faudrait pour que ça te paraisse correct ? »',
      },
      {
        avoid: '« Ce n\'est pas grave, fais-le vite fait, ça ira. »',
        instead: '« Moi je trouve que c\'est déjà très bien. Toi, tu vois encore quelque chose à reprendre ? »',
      },
      {
        avoid: '« Sois un peu plus souple, quand même. »',
        instead: '« Là, je crois qu\'on peut faire une exception. Toi, tu en penses quoi ? »',
      },
    ],
    '수': [
      {
        avoid: '« Arrête de réfléchir et fais-le. »',
        instead: '« Tu es en train de mettre tout ça au clair, c\'est ça ? Dis-moi juste ce qui est déjà clair. »',
      },
      {
        avoid: '« On ne sait jamais ce que tu penses. »',
        instead: '« Si c\'est difficile à dire, tu peux me l\'écrire plus tard. Rien ne presse. »',
      },
      {
        avoid: '« Pourquoi tu ne joues pas avec les autres ? »',
        instead: '« C\'est un jour où tu as besoin d\'être tranquille ? Tu peux rester dans ta chambre si tu veux. »',
      },
    ],
  },
  en: {
    '목': [
      { avoid: '"You never finish anything you start."', instead: '"How far do you want to get with it today? Pick a stopping point and we\'ll call that done."' },
      { avoid: '"You don\'t know what you\'re talking about."', instead: '"Okay, so that\'s how you see it. Mine\'s a little different — want to hear why?"' },
      { avoid: '"Your brother never gave me this much trouble."', instead: '"That one was hard, huh? Tell me where you got stuck."' },
    ],
    '화': [
      { avoid: '"Can you please be quiet for two seconds?"', instead: '"I want to hear all of this — let me finish this one thing first. Five minutes, okay?"' },
      { avoid: '"You\'ll be bored of it in a week, like always."', instead: '"So this is the big thing right now. Want to decide together how long we give it?"' },
      { avoid: '"Why are you making such a big deal out of nothing?"', instead: '"Sounds like that really upset you. Start from the beginning — what happened?"' },
    ],
    '토': [
      { avoid: '"Why are you so slow?"', instead: '"Tell me when you\'re ready. Just say how long you need and I\'ll wait."' },
      { avoid: '"Why don\'t you ever have an opinion?"', instead: '"Out of these three, which one\'s best? You don\'t have to decide now — tell me when it comes to you."' },
      { avoid: '"Just let it go already."', instead: '"It\'s still sitting with you, isn\'t it? Which part is bothering you the most?"' },
    ],
    '금': [
      { avoid: '"Why do you have to nitpick everything?"', instead: '"So by your standard, this isn\'t right. What would it take for it to make sense to you?"' },
      { avoid: '"It doesn\'t have to be perfect, just get it done."', instead: '"This looks plenty good to me — what still feels unfinished to you?"' },
      { avoid: '"Would it kill you to be a little flexible?"', instead: '"This feels like a time we could make an exception. What do you think?"' },
    ],
    '수': [
      { avoid: '"Stop overthinking it and just do it."', instead: '"You\'re still working it out in your head, right? Tell me the part you\'ve got so far."' },
      { avoid: '"I never know what\'s going on with you."', instead: '"If it\'s hard to say out loud, write it down and give it to me later. No rush."' },
      { avoid: '"Why don\'t you play with the other kids?"', instead: '"Is today an alone day? You can stay in your room if you need to."' },
    ],
  },
  zh: {
    '목': [
      { avoid: '「你怎么老是开个头就不管了？」', instead: '「这次你想做到哪儿？做到那儿就收，也算完成了。」' },
      { avoid: '「你懂什么？」', instead: '「原来你是这么想的。我的想法有点不一样，想听听为什么吗？」' },
      { avoid: '「你哥哥从来不用我这么操心。」', instead: '「这件事对你来说有点难吧？卡在哪一步，跟我说说。」' },
    ],
    '화': [
      { avoid: '「你能不能先安静一会儿？」', instead: '「你说的我都想听，让我先把这点做完。给我五分钟，行吗？」' },
      { avoid: '「过两天肯定又扔一边了。」', instead: '「最近最有意思的就是这个吧。我们一起定一下，打算做到什么时候？」' },
      { avoid: '「多大点事儿，至于这么激动吗？」', instead: '「看来你是真委屈了。从头跟我讲讲，到底怎么回事？」' },
    ],
    '토': [
      { avoid: '「你怎么这么磨蹭？」', instead: '「准备好了叫我。你就说需要多长时间，我等着。」' },
      { avoid: '「你怎么一点主见都没有？」', instead: '「这三个里你觉得哪个更好？现在定不下来也没关系，想到了再跟我说。」' },
      { avoid: '「这点事就过去了，别放在心上。」', instead: '「心里还搁着这件事呢。哪一块最让你别扭，说给我听听。」' },
    ],
    '금': [
      { avoid: '「这么点事你也要较真。」', instead: '「按你的标准，这样是不对的。那怎么弄，你才觉得说得通？」' },
      { avoid: '「别追求完美了，差不多得了。」', instead: '「做到这儿我看已经挺好了，你觉得还差什么？」' },
      { avoid: '「你就不能灵活一点？」', instead: '「这回好像可以破个例，你怎么看？」' },
    ],
    '수': [
      { avoid: '「别老想了，赶紧动手。」', instead: '「你还在脑子里理是吧？理到哪儿了，先说这些就行。」' },
      { avoid: '「你心里想什么，我一点都摸不透。」', instead: '「不好开口的话，回头写下来给我也行，不着急。」' },
      { avoid: '「你怎么不跟同学一起玩？」', instead: '「今天想一个人待着吗？需要的话就在房间待着。」' },
    ],
  },
  es: {
    '목': [
      { avoid: '«Siempre empiezas cosas y nunca terminas ninguna.»', instead: '«¿Hasta dónde quieres llegar hoy con esto? Llegas ahí y lo dejas, y ya está.»' },
      { avoid: '«Tú qué vas a saber.»', instead: '«Ah, tú lo ves así. Yo lo veo distinto, ¿te cuento por qué y me dices?»' },
      { avoid: '«Tu hermano no me hacía esto.»', instead: '«Esto te ha costado, ¿eh? ¿Dónde te has atascado más?»' },
    ],
    '화': [
      { avoid: '«¿Te puedes callar un momento, por favor?»', instead: '«Quiero oírlo todo, cariño. Déjame terminar esto y en cinco minutos soy toda tuya.»' },
      { avoid: '«Como siempre, en dos días lo dejas.»', instead: '«Ahora mismo esto es lo que más te gusta. ¿Ponemos entre los dos hasta cuándo?»' },
      { avoid: '«No es para tanto, ¿por qué te pones así?»', instead: '«Te ha dolido de verdad. Cuéntamelo desde el principio, que quiero enterarme bien.»' },
    ],
    '토': [
      { avoid: '«¿Se puede saber por qué tardas tanto?»', instead: '«Avísame cuando estés listo. Dime cuánto tiempo necesitas y te espero.»' },
      { avoid: '«¿Y tú nunca opinas nada?»', instead: '«De estas tres, ¿cuál te gusta más? No hace falta que decidas ahora; cuando lo pienses me lo dices.»' },
      { avoid: '«Déjalo ya, olvídate.»', instead: '«Todavía te da vueltas, ¿no? ¿Qué parte es la que más se te queda?»' },
    ],
    '금': [
      { avoid: '«No te compliques tanto por una tontería.»', instead: '«Para ti así no está bien, ya lo veo. ¿Cómo habría que hacerlo para que te quedes tranquilo?»' },
      { avoid: '«No hace falta que quede perfecto, hazlo de cualquier manera.»', instead: '«A mí me parece que así ya está muy bien. ¿Qué ves tú que falta?»' },
      { avoid: '«Hay que tener un poco de flexibilidad, hijo.»', instead: '«Yo creo que hoy podría ser una excepción. ¿Tú cómo lo ves?»' },
    ],
    '수': [
      { avoid: '«Deja de darle vueltas y haz algo.»', instead: '«Lo estás ordenando en la cabeza, ¿verdad? Cuéntame solo lo que ya tengas claro.»' },
      { avoid: '«Contigo nunca se sabe lo que piensas.»', instead: '«Si te cuesta decirlo, me lo escribes luego en una nota. No hay prisa.»' },
      { avoid: '«¿Por qué no juegas con los demás niños?»', instead: '«¿Hoy es día de estar a tu aire? Si lo necesitas, quédate en tu cuarto.»' },
    ],
  },
  pt: {
    '목': [
      { avoid: '"Você começa tudo e não termina nada."', instead: '"Até onde você quer ir hoje nisso? Chegou ali, pode parar, tudo bem."' },
      { avoid: '"O que é que você entende disso?"', instead: '"Então você acha isso. Eu penso diferente, quer ouvir por quê?"' },
      { avoid: '"Seu irmão nunca fez isso comigo."', instead: '"Isso foi difícil pra você, né? Onde foi que travou mais?"' },
    ],
    '화': [
      { avoid: '"Dá pra ficar quieto um pouco?"', instead: '"Quero ouvir tudo, filho. Deixa eu terminar isso aqui e em cinco minutinhos sou toda sua."' },
      { avoid: '"Daqui a uma semana você já enjoou disso."', instead: '"Agora é isso que você mais gosta, né? Vamos combinar juntos até quando vai?"' },
      { avoid: '"Não é nada demais, por que todo esse escândalo?"', instead: '"Você ficou bem chateado mesmo. Me conta do começo o que aconteceu."' },
    ],
    '토': [
      { avoid: '"Por que você é tão devagar?"', instead: '"Me avisa quando estiver pronto. Só fala quanto tempo você precisa que eu espero."' },
      { avoid: '"Você nunca tem opinião sobre nada?"', instead: '"Desses três, qual você acha melhor? Não precisa decidir agora, quando pensar você me fala."' },
      { avoid: '"Deixa isso pra lá, vai."', instead: '"Ainda tá na sua cabeça, né? Qual parte que mais te incomoda?"' },
    ],
    '금': [
      { avoid: '"Não precisa implicar com cada detalhe."', instead: '"Pelo seu critério isso não tá certo, entendi. O que dava pra fazer pra você ficar satisfeito?"' },
      { avoid: '"Não precisa ficar perfeito, faz de qualquer jeito."', instead: '"Pra mim já ficou muito bom. O que você acha que ainda falta?"' },
      { avoid: '"Tem que ter um pouco de jogo de cintura, filho."', instead: '"Acho que hoje dá pra abrir uma exceção. O que você acha?"' },
    ],
    '수': [
      { avoid: '"Para de pensar tanto e faz logo."', instead: '"Você tá organizando isso na cabeça, né? Me conta só o que já ficou claro."' },
      { avoid: '"Não dá pra saber o que se passa na sua cabeça."', instead: '"Se for difícil falar, você pode me escrever um bilhete depois. Não tem pressa."' },
      { avoid: '"Por que você não brinca com as outras crianças?"', instead: '"Hoje é dia de ficar sozinho? Se você precisar, pode ficar no seu quarto."' },
    ],
  },
  vi: {
    '목': [
      { avoid: '"Con lúc nào cũng vậy, bày ra rồi bỏ dở giữa chừng."', instead: '"Lần này con định làm tới đâu? Làm tới đó rồi dừng cũng được, mẹ không sao đâu."' },
      { avoid: '"Con thì biết gì mà nói."', instead: '"À, con nghĩ vậy hả. Mẹ thì nghĩ hơi khác, con nghe mẹ nói vì sao nhé?"' },
      { avoid: '"Anh con hồi đó có như con đâu."', instead: '"Cái này hơi khó với con đúng không? Con kể mẹ nghe chỗ nào con thấy bí nhất."' },
    ],
    '화': [
      { avoid: '"Con im một lát đi, ồn quá."', instead: '"Mẹ muốn nghe hết chuyện của con, để mẹ làm nốt cái này đã. Con chờ mẹ năm phút nhé?"' },
      { avoid: '"Rồi lại bỏ dở như mấy lần trước chứ gì."', instead: '"Dạo này con mê cái này nhất hả? Hai mẹ con thử định xem làm tới chừng nào nhé?"' },
      { avoid: '"Có chút xíu vậy mà cũng làm ầm lên."', instead: '"Chắc con tủi thân lắm. Kể mẹ nghe từ đầu chuyện gì đã xảy ra đi con."' },
    ],
    '토': [
      { avoid: '"Sao con làm gì cũng chậm rì vậy?"', instead: '"Xong thì con gọi mẹ nhé. Con chỉ cần nói cần bao lâu, mẹ chờ được."' },
      { avoid: '"Sao con chẳng bao giờ có ý kiến gì hết vậy?"', instead: '"Trong ba cái này con thấy cái nào ổn nhất? Giờ chưa chọn cũng được, nghĩ ra thì nói mẹ."' },
      { avoid: '"Thôi bỏ qua đi con, có gì đâu."', instead: '"Chuyện đó vẫn còn nằm trong lòng con hả? Con nói mẹ nghe chỗ nào làm con khó chịu nhất."' },
    ],
    '금': [
      { avoid: '"Chuyện nhỏ xíu mà con cứ bắt bẻ hoài."', instead: '"Theo ý con thì cái này chưa đúng hả. Vậy phải làm sao thì con mới thấy hợp lý?"' },
      { avoid: '"Không cần hoàn hảo đâu, làm đại cho xong đi."', instead: '"Mẹ thấy tới đây là con làm tốt lắm rồi, còn con thấy còn thiếu chỗ nào?"' },
      { avoid: '"Con linh hoạt một chút được không?"', instead: '"Lần này chắc coi như ngoại lệ cũng được đó, con thấy sao?"' },
    ],
    '수': [
      { avoid: '"Đừng nghĩ nữa, làm đi con."', instead: '"Con đang sắp xếp trong đầu đúng không? Nói mẹ nghe phần nào con đã nghĩ xong thôi cũng được."' },
      { avoid: '"Mẹ chẳng biết con nghĩ gì trong bụng nữa."', instead: '"Nói ra khó thì lát nữa con viết ra giấy đưa mẹ cũng được. Không gấp đâu con."' },
      { avoid: '"Sao con không chơi với bạn bè gì hết vậy?"', instead: '"Hôm nay con muốn ở một mình hả? Cần thì con cứ ở trong phòng, mẹ không sao."' },
    ],
  },
  id: {
    '목': [
      { avoid: '"Kamu tuh selalu semangat di awal, tapi nggak pernah selesai."', instead: '"Kali ini kamu mau sampai mana? Sampai situ saja lalu berhenti juga nggak apa-apa."' },
      { avoid: '"Kamu tahu apa, sih."', instead: '"Oh, jadi begitu menurutmu. Bunda pikirnya agak beda, mau dengar alasannya?"' },
      { avoid: '"Kakakmu dulu nggak begitu, lho."', instead: '"Yang ini agak susah buat kamu, ya? Coba cerita, bagian mana yang paling bikin mentok."' },
    ],
    '화': [
      { avoid: '"Sudah, diam dulu, Nak."', instead: '"Bunda mau dengar semuanya, tapi ini diselesaikan dulu ya. Tunggu lima menit, boleh?"' },
      { avoid: '"Paling juga nanti bosan lagi."', instead: '"Lagi paling seru yang ini, ya? Yuk kita tentukan bareng mau sampai kapan."' },
      { avoid: '"Cuma gara-gara begitu saja kok heboh banget."', instead: '"Kayaknya kamu kesal sekali, ya. Coba cerita dari awal, tadi kejadiannya bagaimana."' },
    ],
    '토': [
      { avoid: '"Kok lama sekali, sih?"', instead: '"Kalau sudah siap, bilang ya. Bilang saja butuh berapa lama, Bunda tunggu."' },
      { avoid: '"Kamu kok nggak punya pendapat sendiri?"', instead: '"Dari tiga ini, menurutmu mana yang paling pas? Nggak harus sekarang, kalau sudah kepikiran bilang ya."' },
      { avoid: '"Sudah, dilupakan saja."', instead: '"Masih kepikiran, ya? Cerita dong, bagian mana yang paling mengganjal."' },
    ],
    '금': [
      { avoid: '"Gitu saja kok dipermasalahkan."', instead: '"Jadi menurut standarmu ini belum benar, ya. Bagaimana caranya supaya kamu bisa terima?"' },
      { avoid: '"Nggak usah sempurna-sempurna, asal jadi saja."', instead: '"Menurut Bunda sampai sini sudah bagus, tapi menurutmu masih ada yang kurang?"' },
      { avoid: '"Jangan kaku-kaku amat, dong."', instead: '"Kayaknya kali ini boleh dikecualikan, menurut kamu bagaimana?"' },
    ],
    '수': [
      { avoid: '"Jangan mikir terus, langsung dikerjakan."', instead: '"Lagi kamu susun di kepala, ya? Yang sudah tersusun saja dulu, coba ceritakan."' },
      { avoid: '"Kamu ini susah ditebak, Bunda nggak pernah tahu isi hatimu."', instead: '"Kalau susah diucapkan, nanti tulis saja lalu kasih ke Bunda. Nggak buru-buru, kok."' },
      { avoid: '"Kenapa nggak main sama teman-teman?"', instead: '"Hari ini lagi ingin sendiri, ya? Kalau perlu, di kamar saja dulu nggak apa-apa."' },
    ],
  },
  th: {
    '목': [
      { avoid: '"หนูนี่เริ่มไว้เยอะแยะ แต่ไม่เคยทำให้จบสักอย่าง"', instead: '"คราวนี้หนูอยากทำถึงตรงไหนคะ ทำแค่ตรงนั้นแล้วหยุดก็ได้นะ แม่โอเค"' },
      { avoid: '"หนูจะไปรู้อะไร"', instead: '"อ๋อ หนูคิดแบบนี้นี่เอง แม่คิดต่างไปนิดหน่อย อยากฟังไหมคะว่าทำไม"' },
      { avoid: '"พี่เขาไม่เห็นเป็นแบบนี้เลย"', instead: '"อันนี้มันยากสำหรับหนูใช่ไหม เล่าให้แม่ฟังหน่อยว่าติดตรงไหนมากที่สุด"' },
    ],
    '화': [
      { avoid: '"เงียบก่อนได้ไหม"', instead: '"แม่อยากฟังให้จบเลยนะ ขอทำอันนี้ให้เสร็จก่อน รอแม่สักห้านาทีได้ไหมคะ"' },
      { avoid: '"เดี๋ยวก็เบื่ออีกเหมือนทุกที"', instead: '"ช่วงนี้อันนี้สนุกที่สุดเลยสินะ มาลองตกลงกันไหมคะว่าจะทำถึงเมื่อไหร่"' },
      { avoid: '"แค่เรื่องแค่นี้เอง ทำไมต้องอินขนาดนั้น"', instead: '"เสียใจมากเลยใช่ไหม เล่าให้แม่ฟังตั้งแต่ต้นได้ไหมว่าเกิดอะไรขึ้น"' },
    ],
    '토': [
      { avoid: '"ทำไมช้าอย่างนี้"', instead: '"พร้อมเมื่อไหร่บอกแม่นะ บอกแค่ว่าใช้เวลาเท่าไหร่ แม่รอได้"' },
      { avoid: '"ทำไมหนูไม่เคยมีความคิดเห็นเป็นของตัวเองเลย"', instead: '"ในสามอย่างนี้ หนูว่าอันไหนดีที่สุดคะ ยังไม่ต้องตัดสินใจตอนนี้ก็ได้ นึกออกเมื่อไหร่ค่อยบอกแม่"' },
      { avoid: '"ปล่อยผ่านไปเถอะ"', instead: '"ยังค้างคาใจอยู่ใช่ไหม เล่าให้แม่ฟังหน่อยว่าตรงไหนที่ติดใจมากที่สุด"' },
    ],
    '금': [
      { avoid: '"จะซีเรียสอะไรขนาดนั้น"', instead: '"ในมาตรฐานของหนู อันนี้มันยังไม่ถูกใช่ไหม แล้วต้องทำยังไงหนูถึงจะยอมรับได้"' },
      { avoid: '"ไม่ต้องเป๊ะขนาดนั้นหรอก ทำผ่านๆ ก็พอ"', instead: '"แม่ว่าแค่นี้ก็ดีมากแล้วนะ แต่ในสายตาหนู ยังเหลืออะไรอีกไหมคะ"' },
      { avoid: '"ยืดหยุ่นหน่อยสิ"', instead: '"ครั้งนี้ดูเหมือนจะยกเว้นได้นะ หนูคิดว่ายังไงคะ"' },
    ],
    '수': [
      { avoid: '"เลิกคิดมากแล้วลงมือทำเถอะ"', instead: '"กำลังเรียบเรียงอยู่ในหัวใช่ไหม เล่าเฉพาะส่วนที่เรียบเรียงเสร็จแล้วก็ได้นะ"' },
      { avoid: '"แม่ไม่เคยรู้เลยว่าหนูคิดอะไรอยู่"', instead: '"ถ้าพูดออกมายาก เดี๋ยวเขียนใส่กระดาษมาให้แม่ทีหลังก็ได้ ไม่ต้องรีบนะ"' },
      { avoid: '"ทำไมไม่ไปเล่นกับเพื่อนบ้าง"', instead: '"วันนี้อยากอยู่คนเดียวใช่ไหม ถ้าต้องการก็อยู่ในห้องได้นะ"' },
    ],
  },
};

/**
 * 해당 언어·오행의 저작된 대사쌍을 돌려준다. 없으면 null이고, 호출부는 한국어
 * 원본으로 되돌아간다 — 아직 저작되지 않은 언어가 조용히 빈 블록을 받지 않도록.
 */
function getLocalizedHarmfulPhrases(language, element) {
  return HARMFUL_PHRASES_I18N[language]?.[element] || null;
}

/** 저작이 끝난 언어 목록 (테스트/운영 점검용) */
function localizedLanguages() {
  return Object.keys(HARMFUL_PHRASES_I18N);
}

// 저작은 끝났지만 아직 측정 전이라 게이트를 켜지 않은 언어.
//
// 저작 → 측정 → 켜기 순서를 강제하기 위한 목록이다. 여기에 없고 게이트에도 없는
// 저작 언어가 생기면 테스트가 깨진다 — 저작해 놓고 아무 데도 안 쓰이는(= 죽은
// 작업) 상태를 막기 위해서다.
//
// 켜는 절차:
//   npm run eval:localization -- --langs=<lang> --charts=3 --rounds=3 --label=<lang>-off --regenerate
//   SAJU_LOCALIZED_VOICE=1 node scripts/eval-localization.js --langs=<lang> --charts=3 --rounds=3 --label=<lang>-on --regenerate
// script 보존율이 유의미하게 오르고 fallback이 0이면 saju-knowledge.js의
// LOCALIZED_VOICE_LANGUAGES 기본값에 추가하고 이 목록에서 뺀다.
// (비어 있음 = 저작된 언어가 모두 측정을 거쳐 켜져 있다는 뜻)
const PENDING_MEASUREMENT = ['zh', 'es', 'pt', 'vi', 'id', 'th'];

module.exports = { HARMFUL_PHRASES_I18N, getLocalizedHarmfulPhrases, localizedLanguages, PENDING_MEASUREMENT };

