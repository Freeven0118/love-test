
import { Question, Category } from './types';

// AI 生成指令集：確保視覺一致性與高品質
export const IMAGE_PROMPTS: Record<string, string> = {
  'hero': "Cinematic lifestyle photography of a stylish, confident man and a woman sharing a subtle, warm smile in a sunlit modern cafe. Soft golden hour lighting, deep depth of field, high-end commercial aesthetic, emotional connection, 8k resolution, professional color grading, NO TEXT.",
  '形象外表': "Professional close-up photography of a well-groomed man's morning routine, a clean modern bathroom mirror, soft natural window light, luxury skincare bottles and a sharp white shirt in the background, minimalist aesthetic, cinematic lighting.",
  '社群形象': "A high-end smartphone lying on a dark wood table, screen showing a vibrant and well-curated social media profile with travel and lifestyle photos, soft bokeh background of a cozy lounge, cinematic atmosphere.",
  '行動與互動': "Cinematic wide shot of a romantic evening date in a city terrace, blurred city lights in the background, two wine glasses on a table, warm candlelight, intimate and sophisticated atmosphere, professional photography.",
  '心態與習慣': "A man looking out from a large floor-to-ceiling window at a beautiful sunrise over a modern city skyline, calm and determined posture, cinematic blue and orange tones, inspirational mood, high-quality photography.",
  'expert': "A professional and friendly male image consultant standing in a high-end fashion studio, soft studio lighting, confident and approachable expression, wearing a tailored blazer, blurred background of clothing racks, 8k resolution."
};

export const EXPERT_CONFIG = {
  name: "形象教練 彭邦典",
  title: "自信魅力養成 / 脫單形象塑造",
  imageUrl: "https://d1yei2z3i6k35z.cloudfront.net/2452254/693980ce9054d_mobile2withsign.jpg", 
  description: "如果你想快速改變，我把這幾年的教學經驗濃縮成一套5週、共10個小時的系統化陪跑訓練，陪普通男生學會打造有魅力的外型、塑造自信吸引力、讓女人忍不住多看你一眼，幫你跨出脫單的關鍵第一步。不過每個月只開放三個名額。",
  ctaButtonText: "瞭解它怎麽幫助我"
};

export const QUESTIONS: Question[] = [
  // A. 形象外表
  { id: 1, category: '形象外表', text: '「我有一套自己固定在用的洗臉與保養方式，能讓皮膚大致保持乾淨、氣色穩定，不會長期滿臉痘痘過粉刺」' },
  { id: 2, category: '形象外表', text: '「我知道自己適合哪一種長度和感覺的髮型，出門前也會花時間整理、吹整 or 抓造型，不會讓頭髮亂翹、油塌、看起來沒打理」' },
  { id: 3, category: '形象外表', text: '「我說得出自己適合的大致穿著風格，例如簡約、斯文、成熟，也知道哪些款式和版型特別不適合自己，買衣服時心裡有一把尺」' },
  { id: 4, category: '形象外表', text: '「我知道自己適合什麼樣風格的穿著，能夠很輕鬆地搭配出適合約會或其他重要場合的服裝，也大概知道去哪裡、要怎麼買衣服才不會踩雷」' },
  
  // B. 社群形象
  { id: 5, category: '社群形象', text: '「我現在的頭貼是近期拍的清楚單人照，看得到我的臉，沒有厚重濾鏡，也不是團體照、背影照或看不出我是誰的照片」' },
  { id: 6, category: '社群形象', text: '「我很清楚自己放什麼樣的照片最有吸引力，也懂得挑出最有優點的幾張，現在交友軟體或社群上的主要照片就是照這個標準選出來的」' },
  { id: 7, category: '社群形象', text: '「我大致知道女生會想看到我哪些面向，也會用幾張不同情境的照片去呈現自己，例如生活感、興趣、朋友互動，而不是只有一堆角度差不多的自拍或證件感照片」' },
  { id: 8, category: '社群形象', text: '「我大致知道哪些照片或貼文會拉低第一印象，例如醉到失態、很邋遢、失言貼文，也有刻意刪掉、關掉或限縮可見範圍，不會全部攤在公開頁面」' },
  
  // C. 行動與互動
  { id: 9, category: '行動與互動', text: '「我平常有在經營自己的生活圈，不是只有家和公司，固定會參加一些活動 or 聚會，也有認識到新朋友的機會」' },
  { id: 10, category: '行動與互動', text: '「我知道怎麼讓聊天往曖昧方向發展，不會一直停在交換資訊、聊天氣和日常小事，也懂得用適度的調侃、自我揭露和關心，讓對方感覺得到我對她有興趣」' },
  { id: 11, category: '行動與互動', text: '「我有主動提出約會邀請的經驗，會說出具體的時間和地點，也能依照對方的狀況安排幾個合適的約會行程」' },
  { id: 12, category: '行動與互動', text: '「約會時，我大致知道怎麼帶話題 and 安排節奏，不太會整場冷場或讓氣氛很尷尬；約會結束前，我會主動收尾，暗示或提出下次再見面的可能」' },
  
  // D. 心態與習慣
  { id: 13, category: '心態與習慣', text: '「被已讀、被拒絕或進展卡住時，我會難過一陣子，但還是有能力整理好情緒，在一段合理時間內恢復正常作息，而不是因一次失敗就長期停擺」' },
  { id: 14, category: '心態與習慣', text: '「我很清楚戀愛中的掌控權必須在自己手上，我會為了打造理想的關係，努力讓自己更有魅力」' },
  { id: 15, category: '心態與習慣', text: '「就算工作忙或心情不好，我仍能維持幾個最基本的行動習慣，例如定期剪頭髮、整理衣櫃、維持社交聯絡，而不是一忙就完全放掉好幾個月」' },
  { id: 16, category: '心態與習慣', text: '「當我在同一個地方反覆卡關，例如聊到一個階段就冷掉，我會主動檢討原因，試著調整說話方式 or 做法」' },
];

export const OPTIONS = [
  { label: '非常符合', value: 3 },
  { label: '有點符合', value: 2 },
  { label: '不太符合', value: 1 },
  { label: '完全沒有', value: 0 },
];

export const PERSONAS = [
  {
    id: 'charmer',
    title: '天生魅力家',
    subtitle: '情感與質感的完美平衡者',
    description: '你非常懂得如何展示自己的優點。無論是外在打理、社交媒體的呈現，還是與人互動的節奏感，你都能拿捏得恰到好處。對你來說，戀愛不是追逐，而是一場吸引力的博弈。',
    tags: ['高質感', '社交達人', '心理強大', '行動力滿格'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9b7411b38_1.%E5%A4%A9%E7%94%9F%E9%AD%85%E5%8A%9B%E5%AE%B6.svg'
  },
  {
    id: 'statue',
    title: '精緻的沈默者',
    subtitle: '萬事俱備，只差一個勇敢的開始',
    description: '你看起來無可挑剔，甚至在社群媒體上擁有不錯的人氣。但當進入實戰互動時，你往往會因為過度保護形象而顯得被動。你具備極佳的硬體條件，現在只需要學會如何「冒險」。',
    tags: ['外型優勢', '社群滿分', '行動遲疑', '偶像包袱'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9bf097ed8_2.%E7%B2%BE%E7%B7%BB%E7%9A%84%E6%B2%88%E9%BB%98%E8%80%85.svg'
  },
  {
    id: 'hustler',
    title: '隱形的努力家',
    subtitle: '實力深藏不露，亟需視覺包裝',
    description: '你是一個非常有行動力且心態積極的人。在互動中你真誠且努力，但往往因為忽視了視覺第一印象而讓你在開局時困難重重。只要升級你的「包裝」，你的成功率將會倍增。',
    tags: ['實力派', '行動大師', '視覺盲點', '待磨練的鑽石'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9de953752_3.%E9%9A%B1%E5%BD%A2%E7%9A%84%E5%8A%AA%E5%8A%9B%E5%AE%B6.svg'
  },
  {
    id: 'neighbor',
    title: '溫暖的鄰家男孩',
    subtitle: '穩定可靠，但缺乏一點致命吸引力',
    description: '你在各方面都維持在平均水準。這讓你在朋友圈中很受歡迎，但在戀愛市場中卻容易被歸類為好人。你需要打破這份過於溫和的平衡，展現出更有侵略性或風格感的一面。',
    tags: ['親和力', '狀態穩定', '缺乏特色', '好人卡常客'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9c2d8b687_4.%E6%BA%AB%E6%9A%96%E7%9A%84%E9%84%B0%E5%AE%B6%E7%94%B7%E5%AD%A9.svg'
  },
  {
    id: 'sage',
    title: '理論派大師',
    subtitle: '看透一切邏輯，卻未踏入戰場',
    description: '你對戀愛與心理學有深刻的見解。你懂得很多道理，甚至能給朋友建議，但你的生活圈過於狹窄，或者心態上過於謹慎，導致這些強大的知識儲備無處施展。',
    tags: ['智商高', '心態成熟', '社交圈窄', '實戰缺乏'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9c9460f10_5.%E7%90%86%E8%AB%96%E6%B4%BE%E5%A4%A7%E5%B8%AB.svg'
  },
  {
    id: 'pioneer',
    title: '潛力無限的開拓者',
    subtitle: '黎明前的黑暗，正是蛻變的契機',
    description: '目前你在各個維度的指標都還在起步階段。這雖然代表你現在處於劣勢，但也意味著你擁有最大的成長空間。每一點微小的改變，都會讓你在魅力值上獲得巨大的回饋。',
    tags: ['新手村', '成長空間大', '亟需指引', '勇於嘗試'],
    imageUrl: 'https://d1yei2z3i6k35z.cloudfront.net/2452254/694c9cbfc6cd8_6.%E6%BD%9B%E5%8A%9B%E7%84%A1%E9%99%90%E7%9A%84%E9%96%8B%E6%8B%93%E8%80%85.svg'
  }
];

export const CATEGORY_INFO: Record<Category, { description: string; suggestions: Record<'紅燈' | '黃燈' | '綠燈', string> }> = {
  '形象外表': {
    description: '這一區看的是：第一眼的外在印象。髮型、膚況、穿搭是否讓人一看就知道你有在打理自己。',
    suggestions: {
      '紅燈': '現在的外在打理比較像『不要太邋遢就好』，對朋友來說可以，但對剛認識的女生來說，很容易第一眼就被刷掉。',
      '黃燈': '你已經有基本打理，但還不到『眼前一亮』的程度。只要在髮型、膚況或穿搭其中一兩項做升級，整體感覺會拉高很多。',
      '綠燈': '你的外在打理已經有一定水準，可以開始思考：怎麼把穿搭 and 氣質做出更清楚的風格感，讓人一眼記得你。'
    }
  },
  '社群形象': {
    description: '這一區看的是：在網路上的第一印象。頭貼、照片組合、版面乾淨度，能不能讓人一點進來就知道你是誰、值不值得多看一眼。',
    suggestions: {
      '紅燈': '現在的網路版面比較像『私人相簿』或『什麼都隨便丟』，女生點進來看不到重點，也很難分辨你是怎樣的人，很快就滑走。',
      '黃燈': '你已經有一些不錯的照片與內容，但整體還不夠聚焦，也夾雜幾張會拉低印象的東西。稍微整理頭貼與首頁可見內容，效果會直接提升。',
      '綠燈': '你的社群版面已經能幫你加分，女生只看照片與簡介就會滑走。接下來可以思考的是：怎麼讓版面講出更明確的故事與價值。'
    }
  },
  '行動與互動': {
    description: '這一區看的是：你有沒有把機會往前推。從認識新朋友、開啟聊天、提出邀約，到約會現場的互動與收尾。',
    suggestions: {
      '紅燈': '問題不在你條件多差，而是你幾乎沒有在出手。很少主動開話題、少邀約、遇到機會容易退縮，讓很多本來可以發展的對象直接消失。',
      '黃燈': '你偶爾會主動，也有幾次成功約出來的經驗，但節奏不算穩定。有時聊太久不推進，有時約會後沒有好好收尾，導致關係停在模糊地帶。',
      '綠燈': '你願意主動，也大致懂得怎麼推進關係。接下來可以更細緻地調整約會品質與互動細節，讓對方更清楚感覺到『跟你在一起是舒服又有安全感的』。'
    }
  },
  '心態與習慣': {
    description: '這一區看的是：你能不能長期投資自己，而不是一下衝高、一下躺平。遇到拒絕時的恢復力，以及願不願意調整做法。',
    suggestions: {
      '紅燈': '現在的狀態比較像『一受傷就全面關機』。一次拒絕就讓你停很久，很難維持基本自我打理與社交，久了會對自己越來越沒信心。',
      '黃燈': '你知道要進步，也偶爾會主動調整，但容易被工作、情緒 or 懶惰打斷。行動有一段一段的空窗期，讓成果很難累積起來。',
      '綠燈': '你已經有不錯的心理彈性，遇到挫折會難受，但仍能慢慢站起來、換方法再試。接下來要做的，是讓自己的成長計畫更有系統、更具體。'
    }
  }
};
