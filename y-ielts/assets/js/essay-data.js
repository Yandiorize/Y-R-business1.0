/* ============================================================
 *  雅思写作范文库 · 数据层（本次整体重写）
 *  ---------------------------------------------------------------
 *  本次修改点：
 *    1) 全部范文改为【英文高分范文】，题目 100% 取自 prompts.js 中的
 *       剑桥雅思 17 / 18 / 19 真题（12 篇 Task 1 + 12 篇 Task 2），
 *       id 与 prompts.js 一一对应，可在详情页直接联动原题。
 *    2) 每篇新增 level（易/中/难）、topics（话题标签）、kind（题型）。
 *       字数 words 由 essays.js 依据正文实时统计，避免与正文不一致。
 *    3) 正文支持行内标注，语法：
 *         [[p|中文说明]]…[[/p]]  可借鉴句式（蓝）
 *         [[c|中文说明]]…[[/c]]  衔接词 / 逻辑标记（青）
 *         [[v|中文释义]]…[[/v]]  高分词汇 / 搭配（琥珀）
 *       渲染后点击标注可自动展开右侧对应的折叠注释面板。
 *    4) 每篇附 notes{pattern/cohesion/vocab} 三块折叠面板内容，
 *       以及 analysis（逐段点评）、takeaways（可迁移表达）。
 *  影响范围：仅范文列表 / 详情页与筛选器；与其它模块无耦合。
 *
 *  说明：Task 1 图表范文中的具体数值为依据原卷图表刻度所作的近似读数，
 *        用于示范「如何引用数据」的写法，练习时请以原卷图表为准。
 * ============================================================ */
(function () {
  'use strict';

  window.IELTS_ESSAYS = [

  /* ============================================================
   *  TASK 2 · 议论文（12 篇）
   * ============================================================ */

  {
    id: 'c17-1-2',
    task: 2, book: 17, test: 1, kind: '利弊权衡',
    level: '中', topics: ['工作', '社会'],
    title: '冒险的得与失',
    titleEn: 'Do the advantages of taking risks outweigh the disadvantages?',
    lead: '范文采取「让步 + 区分」策略：承认盲目冒险有害，但论证经过权衡的冒险总体利大于弊。',
    body: [
      '[[c|现象/观点引入，万能开头]]It is often argued that[[/c]] a [[v|乐于承担风险的；敢闯的]]willingness to take risks[[/v]] is an essential ingredient of a fulfilling life, both at work and at home. [[p|利弊类明确表态：先承认反方，再亮立场]]While I accept that reckless behaviour can be costly, I would argue that the potential rewards of calculated risk-taking far outweigh its drawbacks.[[/p]]',
      'The principal benefit of embracing risk is that it [[v|打开通往…的大门]]opens the door to[[/v]] opportunities that caution would [[v|排除；使成为不可能]]rule out[[/v]]. An employee who [[v|主动争取（机会）]]goes after[[/v]] a demanding promotion, or an entrepreneur who invests in an unproven idea, may well fail, but failure of this kind is rarely wasted: it [[v|产生（技能、经验等结果）]]yields[[/v]] skills, contacts and self-knowledge that a safer path would not provide. [[c|递进：补充第二个理由]]Moreover,[[/c]] in a labour market where whole industries can be [[v|被颠覆；被彻底改变]]disrupted[[/v]] within a decade, the willingness to experiment has become a form of security rather than its opposite. Surveys of founders repeatedly show that the most successful entrepreneurs treated an early failure as information rather than as a verdict.',
      '[[c|让步段首：承认反方观点]]That is not to say that[[/c]] risk is [[v|本质上；固有地]]inherently[[/v]] desirable. Decisions taken on [[v|一时冲动]]impulse[[/v]] — gambling with savings, resigning without a plan, or [[v|贸然进入（陌生市场）]]diving into[[/v]] an unfamiliar market — can [[v|使人暴露于…风险]]leave people exposed to[[/v]] debts and stress that [[v|远远超过]]far outweigh[[/v]] any lesson learned. [[p|对比强调句式：把讨论推向更深一层]]The crucial distinction, then, is not between courage and caution but between[[/p]] [[v|经过权衡的]]weighed[[/v]] gambles and blind ones. Families, too, can be destabilised when one improvised decision removes the income on which several people depend.',
      'In conclusion, I believe that taking risks is [[v|权衡下来；总体上看]]on balance[[/v]] advantageous, provided that the possible downside has been [[v|仔细掂量]]weighed up[[/v]] in advance. [[p|建议型结尾：给出可操作方向]]Rather than avoiding uncertainty altogether, individuals should[[/p]] learn to [[v|把风险控制在可承受范围内]]keep risk within tolerable limits[[/v]], so that a setback becomes a detour rather than a disaster.'
    ],
    notes: {
      pattern: [
        'While I accept that …, I would argue that … —— 利弊类最稳妥的表态句式，先让一步再立论。',
        'The crucial distinction is not between A and B but between C and D —— 把话题从表面对立推向本质区分。',
        'Rather than doing X, individuals should do Y —— 结尾给出建议，避免空喊口号。'
      ],
      cohesion: [
        'It is often argued that… —— 引出普遍观点，适合开头第一句。',
        'Moreover, —— 段内递进，比 In addition 更正式。',
        'That is not to say that… —— 让步转折，引出反方并随即限定。'
      ],
      vocab: [
        'willingness to take risks —— 冒险意愿（抽象名词短语，比 like to risk 高级）',
        'opens the door to —— 打开通往…的大门',
        'rule out —— 排除、使不可能',
        'disrupted —— 被颠覆的（形容行业被技术冲击）',
        'leave people exposed to —— 使人暴露于（风险、压力）之下',
        'on balance —— 权衡下来、总体上看'
      ]
    },
    analysis: [
      '第 1 段（审题与立意）：题目是典型的「利弊权衡」，范文没有简单回答「是」，而是先把 risk 拆成 reckless 与 calculated 两类，立意立刻比同龄考生深一层。',
      '第 2 段（论证利）：用「求职晋升」与「创业」两个具体场景支撑抽象论点，并补上一句劳动力市场的时代背景，避免只讲个人不讲社会。',
      '第 3 段（论证弊）：用三个冒号后的并列例子快速铺开，最后用 not between…but between… 收束，把「弊」限定在盲目冒险上。',
      '第 4 段（结尾）：结论 + 条件（provided that）+ 建议，三件事一气呵成，是雅思结尾的标准高分结构。'
    ],
    takeaways: [
      '利弊题的黄金结构：承认反方 → 限定反方适用范围 → 论证己方 → 条件式结论。',
      '抽象论点后必须跟具体例子，例子用「职业 / 创业 / 日常生活」三选一最稳。'
    ]
  },

  {
    id: 'c17-2-2',
    task: 2, book: 17, test: 2, kind: '原因 + 影响',
    level: '中', topics: ['科技', '教育', '健康'],
    title: '孩子为何离不开手机',
    titleEn: 'Why do children spend hours on smartphones? Is this positive or negative?',
    lead: '「原因 + 影响」双问题型：第二段回答 Why，第三段回答 Positive or negative，结构清晰不跑题。',
    body: [
      '[[c|现象引入：从家庭场景切入]]In many households today,[[/c]] it is common to see young children [[v|全神贯注于]]absorbed in[[/v]] a smartphone for several hours a day. [[p|双问型题目：一句话同时回应两问]]There are several reasons for this trend, and although it brings certain benefits, I believe its overall impact is largely negative.[[/p]]',
      'The main cause is that digital entertainment is [[v|被设计成…的]]engineered to be[[/v]] [[v|令人难以自拔的]]compulsive[[/v]]. Video platforms and games rely on [[v|即时奖励]]instant rewards[[/v]] that [[v|牢牢抓住注意力]]hold a child’s attention[[/v]] far more effectively than homework or outdoor play. [[c|引出第二个原因]]A second factor is[[/c]] parental convenience: busy parents [[v|把…当作]]use devices as[[/v]] [[v|廉价的临时保姆]]a cheap babysitter[[/v]], and children quickly learn that a screen is the default way to fill spare time. Because these products are designed by teams of specialists, even adults find them hard to put down, and children have far less self-control.',
      '[[c|由原因转入评价]]The consequences, however, are worrying.[[/c]] [[v|长时间看屏幕]]Prolonged screen time[[/v]] is [[v|与…相关]]linked to[[/v]] [[v|久坐的生活方式]]sedentary routines[[/v]], poor sleep and shorter [[v|注意力持续时间]]attention spans[[/v]], all of which [[v|削弱、损害]]undermine[[/v]] learning. Socially, children who [[v|沉迷于；离不开]]are glued to[[/v]] their phones may [[v|错失…的机会]]miss out on[[/v]] the face-to-face interaction through which [[v|同理心]]empathy[[/v]] and [[v|抗挫力]]resilience[[/v]] are built. Teachers frequently report that pupils who spend their evenings online arrive at school too tired to concentrate, which suggests that the effects are visible in the classroom as well as at home.',
      'In conclusion, smartphones attract children because they are [[v|被设计得极具诱惑力]]designed to be irresistible[[/v]] and because adults [[v|默许；纵容]]connive at[[/v]] their use. [[p|平衡式结尾：肯定局部价值，重申总体判断]]While some educational content is genuinely valuable, I consider the trend negative on balance, and it should be countered with clear limits rather than outright bans.[[/p]] Such limits work best when parents observe them as well, since children copy adult behaviour far more faithfully than they obey instructions.'
    ],
    notes: {
      pattern: [
        'There are several reasons for this trend, and although …, I believe … —— 双问题型题目的高效开头。',
        'all of which + 动词 —— 非限制性定语从句收束一串后果，句式紧凑。',
        'while …, I consider … on balance —— 结尾兼顾两面，体现批判性思维。'
      ],
      cohesion: [
        'In many households today, —— 场景化引入，比 Nowadays 更有画面。',
        'A second factor is… —— 原因段内的清晰分层。',
        'The consequences, however, are worrying. —— 从原因段切换到影响段的转折句。'
      ],
      vocab: [
        'absorbed in —— 全神贯注于',
        'engineered to be compulsive —— 被设计成令人上瘾的',
        'prolonged screen time —— 长时间使用屏幕',
        'sedentary routines —— 久坐不动的日常',
        'are glued to —— 离不开、黏在…上',
        'miss out on —— 错失…的机会'
      ]
    },
    analysis: [
      '第 1 段：题目有两问（Why / Positive or negative），开头句先把「要回答两件事」说清楚，避免只答一问。',
      '第 2 段：两个原因分别指向产品设计（外部）与家长便利（家庭），层次分明，不是重复的同义改写。',
      '第 3 段：影响从身体健康写到社交能力，用 all of which 把三者打包，语言效率高。',
      '第 4 段：结尾呼应开头的原因，再给出「限制而非禁止」的务实态度。'
    ],
    takeaways: [
      '双问型题目务必分段作答：一问一段，阅卷人一眼能看到。',
      '原因要区分「外部诱因」与「人的选择」，避免两段说同一件事。'
    ]
  },

  {
    id: 'c17-3-2',
    task: 2, book: 17, test: 3, kind: '双方讨论',
    level: '难', topics: ['工作', '全球化'],
    title: '专业人才该不该留在培养他们的国家',
    titleEn: 'Should professionals work in the country where they trained?',
    lead: '双方讨论型：A 段写「强制服务」的理由，B 段写「自由流动」的理由并带出个人观点。',
    body: [
      '[[c|双方讨论型开头：点明分歧]]Opinions differ sharply over whether[[/c]] qualified professionals such as doctors and engineers [[v|有义务做某事]]have a duty to[[/v]] practise in the country that trained them. [[p|亮明个人立场：理解 A，但倾向 B]]While I understand the argument for imposing such an obligation, I believe professionals should ultimately be free to choose where they work.[[/p]]',
      'Those who favour [[v|一段强制服务期]]a compulsory period of service[[/v]] [[v|提出有力的论点]]advance a persuasive case[[/v]]. Training a doctor or an engineer is [[v|由公共财政大量补贴的]]heavily subsidised by the state[[/v]], and when graduates [[v|移居海外]]move abroad[[/v]], the country that paid for their education [[v|得不到投资回报]]sees no return on its investment[[/v]]. In many developing regions this [[v|人才外流]]brain drain[[/v]] leaves hospitals [[v|长期人手不足]]chronically understaffed[[/v]], so the [[v|道义上的理由]]moral argument[[/v]] for [[v|回馈社会]]giving something back[[/v]] is hard to dismiss. The problem is most acute in countries where only a small proportion of school leavers can afford medical or engineering training in the first place.',
      '[[c|切换到另一方观点]]On the other hand,[[/c]] [[v|限制流动]]restricting mobility[[/v]] [[v|与…格格不入]]sits uneasily with[[/v]] the principle that individuals should [[v|自主规划职业生涯]]direct their own careers[[/v]]. [[p|用递进句带出自己为何倾向此方]]Moreover, the benefits of migration are not one-way:[[/p]] [[v|侨汇]]remittances[[/v]], [[v|带回国的技能]]skills brought home[[/v]] and [[v|跨国专业网络]]professional networks[[/v]] can all [[v|使来源国受益]]benefit the country of origin[[/v]] in the long run. Many migrants also return after a decade abroad, bringing capital and expertise that would never have accumulated had they been required to stay.',
      'In conclusion, although the loss of skilled workers is a real [[v|政策两难]]policy dilemma[[/v]], I would argue that [[v|强制毕业生留下]]forcing graduates to stay[[/v]] is both [[v|难以执行的]]impractical[[/v]] and [[v|适得其反的]]counterproductive[[/v]]. A fairer solution is to make staying attractive — better pay, research funding and career prospects — rather than to [[v|限制离开的自由]]restrict the freedom to leave[[/v]]. Retention schemes funded by aid budgets offer one practical compromise, since they reward those who stay without penalising those who leave.'
    ],
    notes: {
      pattern: [
        'While I understand the argument for …, I believe … —— 双方讨论型最自然的表态方式。',
        'Moreover, the benefits of … are not one-way: —— 用「不是单向的」反驳对方，逻辑漂亮。',
        'A fairer solution is to … rather than to … —— 结尾提出替代方案，避免简单重复立场。'
      ],
      cohesion: [
        'Opinions differ sharply over whether… —— 开篇点题，直接承认分歧。',
        'On the other hand, —— 段落级别的观点切换。',
        'In conclusion, although …, I would argue that… —— 让步式结论，语气成熟。'
      ],
      vocab: [
        'have a duty to —— 有义务做…',
        'heavily subsidised by the state —— 由国家大量补贴的',
        'brain drain —— 人才外流',
        'chronically understaffed —— 长期人手不足的',
        'restricting mobility —— 限制人员流动',
        'counterproductive —— 适得其反的'
      ]
    },
    analysis: [
      '第 1 段：题目是「双方讨论 + 给出自己观点」，结尾句必须出现自己的 opinion，范文用 while 从句完成。',
      '第 2 段：写反方（强制服务）时用了「公共投入—人才外流—医院缺人」的链条，论证层层推进而非罗列。',
      '第 3 段：写己方时用「原则」+「长远收益」两条，其中 remittances / skills brought home 是很具体的支撑。',
      '第 4 段：结论给出政策建议（让留下变得有吸引力），比空谈「应该平衡」更有说服力。'
    ],
    takeaways: [
      '双方讨论型：A 段 / B 段各 100 词左右，自己的观点可以放在 B 段末或结论段，但必须清晰。',
      '写「人才外流」类话题，准备 brain drain、remittances、understaffed 三个词就够撑起一段。'
    ]
  },

  {
    id: 'c17-4-2',
    task: 2, book: 17, test: 4, kind: '积极 / 消极',
    level: '中', topics: ['健康', '社会'],
    title: '转向替代疗法是好事吗',
    titleEn: 'Are alternative medicines a positive or negative development?',
    lead: '积极消极型：立场带限定条件（provided that…），比单纯说 positive 更显思辨。',
    body: [
      '[[c|趋势引入]]A noticeable trend in recent years is that[[/c]] growing numbers of patients are [[v|转向；求助于]]turning to[[/v]] herbal remedies, acupuncture and other [[v|替代疗法]]alternative therapies[[/v]] instead of [[v|去看常诊医生]]consulting their usual doctor[[/v]]. [[p|明确立场 + 限定条件]]In my view this development is largely positive, provided that it complements rather than replaces conventional medicine.[[/p]]',
      'The clearest advantage is [[v|更大的患者自主权]]greater patient autonomy[[/v]]. People who [[v|主动参与自身健康管理]]take an active role in their own care[[/v]] tend to [[v|养成更健康的生活习惯]]adopt healthier routines[[/v]], and several complementary treatments — for [[v|慢性疼痛]]chronic pain[[/v]] or [[v|焦虑]]anxiety[[/v]], for example — are supported by [[v|可靠的证据]]credible evidence[[/v]]. There is also a practical benefit: in health systems where [[v|全科医生一号难求]]GP appointments are scarce[[/v]], alternative options can [[v|缓解压力]]ease the pressure[[/v]] on [[v|不堪重负的]]overstretched[[/v]] services. In several European countries, family doctors now refer patients for acupuncture or mindfulness training, which shows that the boundary between the two approaches is already blurring.',
      '[[c|让步转折：指出风险]]The danger, however, is that[[/c]] unregulated products may be ineffective or [[v|与处方药产生不良相互作用]]interact badly with prescribed drugs[[/v]], and a patient who [[v|延误正规治疗]]delays proper treatment[[/v]] can [[v|让本可治愈的病情恶化]]allow a treatable condition to worsen[[/v]] — especially where the therapy is [[v|用伪科学话术营销的]]marketed with pseudo-scientific claims[[/v]]. For this reason, most professional bodies advise patients to disclose every remedy they are taking, however harmless it appears.',
      'Overall, I regard the shift towards alternative medicine as [[v|总体有益的]]broadly beneficial[[/v]], because it [[v|拓宽选择]]widens choice[[/v]] and encourages [[v|自我主导的健康管理]]self-directed care[[/v]]. [[p|结尾给对策而非简单收束]]What is needed is not prohibition but[[/p]] honest [[v|监管与信息披露]]regulation and clearer information[[/v]], so that patients can combine therapies safely. Doctors, for their part, need training that enables them to discuss complementary treatments without appearing dismissive, so that patients feel able to be honest.'
    ],
    notes: {
      pattern: [
        'In my view this development is largely positive, provided that… —— 立场 + 条件，避免绝对化。',
        'What is needed is not X but Y —— 结尾提对策的万能句式。',
        'There is also a practical benefit: … —— 补充第二个论点时的过渡句。'
      ],
      cohesion: [
        'A noticeable trend in recent years is that… —— 描述社会趋势的开头。',
        'The clearest advantage is… —— 论点段主题句。',
        'The danger, however, is that… —— 让步段开头，语气果断。'
      ],
      vocab: [
        'turning to —— 转向、求助于',
        'patient autonomy —— 患者自主权',
        'chronic pain —— 慢性疼痛',
        'overstretched services —— 不堪重负的公共服务',
        'interact badly with —— 与…产生不良相互作用',
        'pseudo-scientific claims —— 伪科学宣传'
      ]
    },
    analysis: [
      '第 1 段：用 provided that 给立场加条件，是本篇最值得学的一处——雅思高分卷很少全盘肯定或否定。',
      '第 2 段：从「患者主动性」与「缓解医疗系统压力」两个层面写利，兼顾个人与社会。',
      '第 3 段：让步段只写一段、控制在 60 词左右，既照顾批判性思维，又不喧宾夺主。',
      '第 4 段：结尾落在「监管 + 信息透明」，与开头的 provided that 形成呼应。'
    ],
    takeaways: [
      '积极 / 消极题：立场 = 判断 + 条件，用 provided that / as long as 加限定。',
      '健康类话题高频词：autonomy、chronic、overstretched、regulated，记熟即可覆盖多数题目。'
    ]
  },

  {
    id: 'c18-1-2',
    task: 2, book: 18, test: 1, kind: '同意与否',
    level: '难', topics: ['科技', '社会'],
    title: '科学最重要的目标是改善生活吗',
    titleEn: 'Should the most important aim of science be to improve people’s lives?',
    lead: '同意与否型：采取「大体同意 + 保留」的 nuanced 立场，第三段用历史论据支撑保留意见。',
    body: [
      '[[c|转述题目观点]]It is sometimes claimed that[[/c]] the [[v|首要目标]]overriding purpose[[/v]] of science should be to [[v|改善人类福祉]]improve human well-being[[/v]]. [[p|部分同意：先同意，再补充保留]]I largely agree with this view, although I would argue that science also has an important role in satisfying curiosity for its own sake.[[/p]]',
      'The strongest argument in favour is that research is [[v|主要由公共资金支持]]funded largely by public money[[/v]], and taxpayers are entitled to see [[v|看得见的回报]]tangible returns[[/v]] — new vaccines, cleaner energy, [[v|产量更高的农业]]more productive agriculture[[/v]]. [[p|强调句式，突出论点核心]]It is this practical payoff that[[/p]] [[v|使…具有正当性]]legitimises[[/v]] spending on science in the eyes of voters and politicians alike. When research appears remote from everyday concerns, public trust erodes, and with it the willingness to fund the next generation of projects.',
      '[[c|让步 + 反转：引出保留意见]]Nevertheless, history suggests that[[/c]] [[v|狭隘功利主义的]]a narrowly utilitarian[[/v]] agenda can be [[v|目光短浅的]]short-sighted[[/v]]. Much of today’s technology rests on discoveries that were [[v|纯粹出于好奇而做出的]]pursued out of pure curiosity[[/v]]: [[v|量子力学]]quantum mechanics[[/v]] and [[v|数论]]number theory[[/v]] had no obvious application when they were developed, yet they now [[v|支撑着]]underpin[[/v]] everything from [[v|智能手机]]smartphones[[/v]] to [[v|加密技术]]encryption[[/v]]. [[p|虚拟语气，增强论证力度]]Had funding been restricted to projects with immediate benefits, these foundations would never have been laid.[[/p]] A funding system that demanded immediate utility would therefore cut off the supply of basic knowledge on which applied science depends.',
      'In conclusion, I agree that improving lives should be science’s [[v|核心使命]]central mission[[/v]], since that is what [[v|维系公众支持]]sustains public support[[/v]]. At the same time, a healthy research culture must [[v|为好奇心驱动的研究留出空间]]leave room for curiosity-driven inquiry[[/v]], because the line between [[v|无用的知识]]useless knowledge[[/v]] and tomorrow’s breakthrough is rarely visible in advance. In practice the two aims are less opposed than they appear, because curiosity-driven work is what produces the surprises that later transform lives.'
    ],
    notes: {
      pattern: [
        'I largely agree …, although I would argue that… —— 「大体同意 + 保留」，比 fully agree 更成熟。',
        'It is this practical payoff that… —— it is … that… 强调句，突出关键词。',
        'Had funding been restricted …, … would never have been laid. —— 对过去的虚拟语气，论证有分量。'
      ],
      cohesion: [
        'It is sometimes claimed that… —— 转述题目观点的标准开头。',
        'Nevertheless, history suggests that… —— 用历史视角转折，语气克制而有说服力。',
        'At the same time, —— 结论段中平衡两方的连接词。'
      ],
      vocab: [
        'overriding purpose —— 首要目标',
        'tangible returns —— 看得见的回报',
        'narrowly utilitarian —— 狭隘功利主义的',
        'short-sighted —— 目光短浅的',
        'underpin —— 支撑、构成…的基础',
        'curiosity-driven inquiry —— 好奇心驱动的研究'
      ]
    },
    analysis: [
      '第 1 段：同意与否题最忌讳 I completely agree，范文用 largely + although 立刻拉高档次。',
      '第 2 段：从「科研经费来自纳税人」切入，理由具体且政治正确，再用强调句收束。',
      '第 3 段：用量子力学与数论两个真实案例支撑「好奇心也有价值」，并配虚拟语气，是全篇亮点。',
      '第 4 段：结论重申核心立场，同时用 because 补一句为什么保留意见重要，收得干净。'
    ],
    takeaways: [
      '同意与否题推荐写法：largely agree / partly disagree，再分两段分别论证。',
      '虚拟语气（Had … been …, … would have …）是 Task 2 的加分语法点，每篇用一次即可。'
    ]
  },

  {
    id: 'c18-2-2',
    task: 2, book: 18, test: 2, kind: '双方讨论',
    level: '易', topics: ['教育'],
    title: '大学生该不该学专业以外的课',
    titleEn: 'Should students study subjects beyond their main field?',
    lead: '教育类双方讨论型：范文立场是「专业深度重要，但广度更有长远价值」，论据贴近就业现实。',
    body: [
      '[[c|双方讨论型开头]]Some university students feel that[[/c]] they should [[v|接触；涉猎]]be exposed to[[/v]] subjects outside their [[v|所选专业]]chosen field[[/v]], while others insist that all their time should be [[v|投入于]]devoted to[[/v]] their [[v|学位课程]]degree course[[/v]]. [[p|亮明观点：承认对方有理，但倾向另一方]]In my opinion, although specialisation has clear merits, a broader curriculum prepares graduates better for both work and life.[[/p]]',
      'Those who [[v|主张专精]]advocate narrow specialisation[[/v]] argue that degree programmes are already [[v|要求很高的]]demanding[[/v]], and that [[v|分散精力]]spreading one’s efforts[[/v]] risks [[v|浅尝辄止的知识]]superficial knowledge[[/v]]. In [[v|高度技术性的领域]]highly technical fields[[/v]] such as medicine or engineering, [[v|对核心专业的精通]]mastery of the core discipline[[/v]] is [[v|不可或缺的]]indispensable[[/v]], and employers [[v|看重]]value[[/v]] graduates who can [[v|入职即上手]]contribute from day one[[/v]]. For such courses, an additional module in an unrelated subject may simply add workload without adding competence.',
      '[[c|切换到另一方]]From another perspective,[[/c]] [[v|跨学科学习]]interdisciplinary study[[/v]] [[v|培养]]cultivates[[/v]] the flexible thinking that modern careers demand. A programmer who understands [[v|心理学]]psychology[[/v]] designs better interfaces; an engineer who has studied ethics [[v|更有能力预见]]is better equipped to anticipate[[/v]] the social impact of a project. [[p|递进补充]]What is more,[[/p]] [[v|广泛的兴趣]]wide-ranging interests[[/v]] make for more [[v|适应性强的员工]]adaptable employees[[/v]] at a time when [[v|职业转换]]career changes[[/v]] are [[v|常态]]the norm[[/v]]. In a labour market where job descriptions change every few years, the ability to learn across boundaries matters more than any single body of facts.',
      'To conclude, I accept that depth matters and that students should not [[v|荒废核心课程]]neglect their core subjects[[/v]]. However, I believe universities should [[v|鼓励而不是压制]]encourage rather than discourage[[/v]] study beyond the [[v|单一学科的边界]]confines of a single discipline[[/v]], since [[v|受过广博教育的毕业生]]broadly educated graduates[[/v]] tend to [[v|走得更远]]go further in the long run[[/v]]. A degree that combines depth with one genuine second interest is, in most cases, more valuable than either extreme.'
    ],
    notes: {
      pattern: [
        'In my opinion, although X has clear merits, Y … —— 双方讨论型的平衡表态。',
        'A … who … does …; a … who … does … —— 两个平行例子，节奏感强。',
        'encourage rather than discourage —— rather than 连接的对称结构，简洁有力。'
      ],
      cohesion: [
        'Some … feel that …, while others insist that… —— 一句话概括双方。',
        'From another perspective, —— 段首切换视角。',
        'What is more, —— 递进补充，比 Besides 更书面。'
      ],
      vocab: [
        'be exposed to —— 接触、涉猎',
        'advocate narrow specialisation —— 主张高度专精',
        'superficial knowledge —— 浮于表面的知识',
        'indispensable —— 不可或缺的',
        'interdisciplinary study —— 跨学科学习',
        'adaptable employees —— 适应性强的员工'
      ]
    },
    analysis: [
      '第 1 段：双方立场各半句说清，观点落在「广度更好」，直接回应题目。',
      '第 2 段：先替对方说话（时间有限、专业要求高），且举出医学工程这类真实例外，显得客观。',
      '第 3 段：己方论点用「程序员 + 心理学」「工程师 + 伦理学」两组跨界例子，形象且好记。',
      '第 4 段：结论既不否定深度，又重申广度，是典型的 balanced conclusion。'
    ],
    takeaways: [
      '教育类题目往往可以套用「深度 vs 广度」这一组对立，准备一组跨界例子即可通用。',
      '写对方观点时给一个「真实例外」（医学、工程），论证会明显更可信。'
    ]
  },

  {
    id: 'c18-3-2',
    task: 2, book: 18, test: 3, kind: '积极 / 消极',
    level: '中', topics: ['社会', '环境'],
    title: '农村人口涌入城市是好事吗',
    titleEn: 'Is rural-to-urban migration a positive or negative development?',
    lead: '先写城市与农村的双重代价（负面），再让步承认集聚效益，最后落到「政府应主动管理」。',
    body: [
      '[[c|现象引入]]In much of the world,[[/c]] villages are [[v|在持续流失人口]]steadily emptying[[/v]] as people move to cities in search of work. [[p|立场带条件：承认收益，但判断总体消极]]Although this migration brings undeniable economic gains, I believe its overall effect is negative unless governments actively manage it.[[/p]]',
      'The most immediate problem is [[v|城市超载]]urban overload[[/v]]. Cities that cannot [[v|跟上涌入速度]]keep pace with the influx[[/v]] end up with [[v|过度拥挤的住房]]overcrowded housing[[/v]], [[v|拥堵的道路]]congested roads[[/v]] and [[v|紧张的水电供应]]strained water and power supplies[[/v]]. [[c|递进：补上农村一侧的代价]]In addition,[[/c]] the countryside [[v|付出代价]]pays a price[[/v]]: as [[v|年轻劳动力离开]]young workers leave[[/v]], farms [[v|撂荒]]fall idle[[/v]] and [[v|地方社区]]local communities[[/v]] [[v|衰败下去]]decline[[/v]], which in turn [[v|加剧下一轮外流]]fuels further migration[[/v]]. In the largest cities the shortage of affordable housing forces newcomers into informal settlements where clean water and sanitation are unreliable. As the working-age population leaves, local schools and clinics close, which makes remaining behind even less attractive.',
      '[[c|让步段：承认正面]]On the positive side,[[/c]] cities [[v|更高效地提供公共服务]]deliver services more efficiently[[/v]] — a single hospital or school can serve far more people — and [[v|人口密度]]density[[/v]] [[v|激发创新]]sparks innovation[[/v]] and [[v|提高生产率]]raises productivity[[/v]]. Migrants themselves often [[v|寄钱回乡]]send remittances home[[/v]] that [[v|维持留守家庭生计]]sustain the families left behind[[/v]]. In addition, a smaller rural population places less pressure on fragile land, which can allow damaged ecosystems to recover.',
      'Overall, while urban growth [[v|推动经济增长]]drives economic growth[[/v]], I consider [[v|缺乏管理的城市化]]unmanaged urbanisation[[/v]] negative, because it [[v|加剧不平等]]deepens inequality[[/v]] and [[v|掏空农村地区]]drains rural areas[[/v]]. [[p|对策型结尾]]Governments should therefore invest in[[/p]] [[v|中小城镇与乡村基础设施]]smaller towns and rural infrastructure[[/v]], so that migration becomes a choice rather than [[v|唯一的出路]]the only escape[[/v]]. Investment in transport links and remote-working infrastructure would allow people to reach urban opportunities without abandoning rural communities. The most effective response is therefore to make rural areas viable rather than to discourage movement itself.'
    ],
    notes: {
      pattern: [
        'Although X brings undeniable gains, I believe … unless … —— 立场带条件，避免一概而论。',
        'which in turn + 动词 —— 表示连锁反应，适合写社会问题。',
        'Governments should therefore invest in …, so that … —— 结尾对策句。'
      ],
      cohesion: [
        'In much of the world, —— 全球视野的开头。',
        'In addition, —— 补充同类论点。',
        'On the positive side, —— 让步段开头，标示段落功能。'
      ],
      vocab: [
        'steadily emptying —— 持续流失人口（村庄变空）',
        'keep pace with the influx —— 跟上人口涌入的速度',
        'overcrowded housing —— 过度拥挤的住房',
        'fall idle —— 撂荒、闲置',
        'sparks innovation —— 激发创新',
        'unmanaged urbanisation —— 缺乏管理的城市化'
      ]
    },
    analysis: [
      '第 1 段：题目问 positive or negative，范文说 negative，但加了 unless governments manage it，立场更严谨。',
      '第 2 段：把「城市」和「农村」两侧的代价都写到，视角完整；which in turn 串起恶性循环。',
      '第 3 段：让步段给出集聚效益与侨汇两个具体好处，避免一边倒。',
      '第 4 段：结论回到政府责任，提出投资中小城镇，与开头的 unless 呼应。'
    ],
    takeaways: [
      '城市化 / 人口迁移类题目，可用「推力—拉力—后果—对策」四步展开。',
      '写负面现象时，把「城市侧」和「农村侧」都写，论证立刻立体。'
    ]
  },

  {
    id: 'c18-4-2',
    task: 2, book: 18, test: 4, kind: '利弊权衡',
    level: '难', topics: ['社会', '政府'],
    title: '老龄化社会的利与弊',
    titleEn: 'Do the advantages of an ageing population outweigh the disadvantages?',
    lead: '利弊权衡型：先写财政压力（弊），再用志愿服务、经验与银发经济三段论据翻盘（利）。',
    body: [
      '[[c|现象 + 常见看法引入]]People are now living longer than at any point in history,[[/c]] and this [[v|人口结构转变]]demographic shift[[/v]] is often [[v|被描绘成]]portrayed as[[/v]] a [[v|财政负担]]fiscal burden[[/v]]. [[p|权衡型表态：承认弊，判断利更大]]In my view the drawbacks are real and immediate, but they are outweighed by less obvious yet substantial advantages.[[/p]]',
      'The main disadvantage is fiscal. As the [[v|退休人口占比]]proportion of retirees[[/v]] rises, governments must [[v|在…上花更多钱]]spend more on[[/v]] pensions, [[v|长期照护]]long-term care[[/v]] and [[v|与年龄相关的疾病]]age-related illness[[/v]], while the [[v|劳动年龄人口]]working-age population[[/v]] [[v|相对萎缩]]shrinks in relative terms[[/v]]. [[p|结果句式：把因果说清楚]]The result is that[[/p]] [[v|税负上升]]taxes rise[[/v]] and other budgets are squeezed, which can [[v|激化代际矛盾]]fuel intergenerational resentment[[/v]]. The effect is compounded by the fact that medical costs rise fastest in the final years of life, when treatment is most intensive. In Japan, for example, the share of public spending devoted to pensions has roughly doubled in three decades.',
      '[[c|转折进入优势段]]Set against this, however, are considerable benefits.[[/c]] Older people [[v|以志愿服务回馈社会]]contribute through volunteering[[/v]] and [[v|照看孙辈]]childcare for grandchildren[[/v]], [[v|实际上]]effectively[[/v]] [[v|补贴公共服务]]subsidising public services[[/v]] and [[v|让年轻父母得以工作]]freeing younger parents to work[[/v]]. They also [[v|拥有]]possess[[/v]] [[v|难以替代的经验]]institutional knowledge[[/v]] and [[v|消费力]]spending power[[/v]], and the [[v|银发经济]]silver economy[[/v]] — from [[v|无障碍住房]]accessible housing[[/v]] to [[v|医疗科技]]medical technology[[/v]] — is [[v|快速增长的产业]]a fast-growing industry[[/v]]. Surveys in several countries suggest that grandparents provide a substantial share of childcare that would otherwise fall to the state.',
      'In conclusion, although an ageing society [[v|带来真实的财政压力]]poses genuine fiscal strain[[/v]], I believe the advantages outweigh the disadvantages, [[v|前提是]]provided that[[/v]] policy [[v|随之调整]]adapts accordingly[[/v]]: [[v|更晚的退休年龄]]later retirement ages[[/v]], [[v|终身学习]]lifelong learning[[/v]] and [[v|适老化设计]]age-friendly design[[/v]] can turn longevity into an asset rather than a liability. Raising the retirement age must also be accompanied by measures that keep older workers healthy, otherwise the reform merely shifts costs elsewhere.'
    ],
    notes: {
      pattern: [
        'the drawbacks are real and immediate, but they are outweighed by … —— 利弊题的直接回答。',
        'The result is that … — 因果链条收束，避免论点悬空。',
        'Set against this, however, are considerable benefits. —— 倒装句引出优势段，很有节奏。'
      ],
      cohesion: [
        'People are now living longer than at any point in history, —— 用事实开场。',
        'As the proportion of … rises, … —— 双变化同步描述。',
        'provided that —— 给结论加条件，语气严谨。'
      ],
      vocab: [
        'demographic shift —— 人口结构转变',
        'fiscal burden —— 财政负担',
        'long-term care —— 长期照护',
        'shrinks in relative terms —— 相对萎缩',
        'institutional knowledge —— 组织 / 社会积累的经验',
        'silver economy —— 银发经济'
      ]
    },
    analysis: [
      '第 1 段：题目明确问 do the advantages outweigh，结尾句直接用了 outweigh 这个词，扣题精准。',
      '第 2 段：从养老金、长期照护、医疗三项支出切入，再用 while 对比劳动力萎缩，论证密度高。',
      '第 3 段：三个优势（志愿服务 / 经验 / 消费力）分层次，银发经济是最容易被忽略却很加分的一点。',
      '第 4 段：结论用 provided that 引出三项政策，把「长寿」重新定义为资产。'
    ],
    takeaways: [
      '利弊题一定要出现 outweigh / on balance 这类扣题词，让阅卷人一眼看到你回答了问题。',
      '老龄化话题必备搭配：fiscal strain、long-term care、silver economy、age-friendly。'
    ]
  },

  {
    id: 'c19-1-2',
    task: 2, book: 19, test: 1, kind: '双方讨论',
    level: '中', topics: ['教育', '工作', '社会'],
    title: '竞争还是合作',
    titleEn: 'Is competition at work, at school and in daily life a good thing?',
    lead: '双方讨论型：承认竞争的选拔功能，但论证学校与职场过度强调竞争有害，主张向合作倾斜。',
    body: [
      '[[c|概括双方分歧]]Some people regard competition as[[/c]] a [[v|有益的驱动力]]healthy driving force[[/v]] in schools, workplaces and everyday life, whereas others argue that we should [[v|更加重视合作]]put more emphasis on cooperation[[/v]]. [[p|观点：双方都有价值，但倾向合作]]In my view both have value, but education systems in particular would benefit from tilting the balance towards cooperation.[[/p]]',
      '[[c|先写一方观点]]Those who defend competition[[/c]] point out that [[v|排名与选拔]]ranking and selection[[/v]] are unavoidable: universities and employers must [[v|区分候选人]]differentiate between candidates[[/v]], and [[v|力争上游的压力]]the pressure to excel[[/v]] can [[v|激励某人发挥潜力]]motivate students to realise their potential[[/v]]. [[p|补强同一方论点]]It is also true that[[/p]] competitive sport and debating teach [[v|韧性]]resilience[[/v]] and [[v|如何体面地接受失败]]how to lose gracefully[[/v]]. Without any mechanism for ranking, university places and promotions would be allocated arbitrarily, which would hardly be fairer. Competition also prepares young people for the selection processes they will meet later in life, from university admissions to job interviews.',
      '[[c|切换到另一方]]Critics counter that[[/c]] [[v|零和式竞争]]zero-sum rivalry[[/v]] [[v|滋生焦虑]]breeds anxiety[[/v]], [[v|抑制冒险精神]]discourages risk-taking[[/v]] and [[v|侵蚀关系]]erodes relationships[[/v]]; a classroom organised around [[v|排名表]]league tables[[/v]] may [[v|打击后进学生]]demoralise the weakest pupils[[/v]] without [[v|提升整体水平]]raising overall standards[[/v]]. Cooperation, [[c|对比连接]]by contrast,[[/c]] [[v|汇集多元视角]]pools diverse perspectives[[/v]] and [[v|培养同理心]]builds empathy[[/v]] — precisely the skills that [[v|现代雇主]]modern employers[[/v]] say they [[v|求贤若渴]]desperately need[[/v]]. Where cooperation is rewarded, students are also more willing to admit what they do not understand, which is the first step towards learning it.',
      'In conclusion, while competition has a legitimate role in [[v|选拔与激励人才]]selecting and motivating people[[/v]], I believe society [[v|过于看重]]attaches too much weight to[[/v]] it. [[p|结尾给出改进方向]]Schools and employers should therefore design tasks that reward shared achievement,[[/p]] so that [[v|赢不再以别人的失败为代价]]winning no longer requires someone else to lose[[/v]]. This does not mean abolishing competition, but rather ensuring that it is not the only way in which success can be recognised.'
    ],
    notes: {
      pattern: [
        'In my view both have value, but … would benefit from tilting the balance towards … —— 折中表态。',
        'It is also true that … —— 给同一方补一个论点，避免段落单薄。',
        'Schools and employers should therefore design tasks that …, so that … —— 结尾建议句式。'
      ],
      cohesion: [
        'Some people regard … as …, whereas others argue that… —— 一句话写清双方。',
        'Critics counter that… —— 引出反方观点的地道表达。',
        'by contrast, —— 段内对比，比 however 更精确。'
      ],
      vocab: [
        'a healthy driving force —— 有益的驱动力',
        'put more emphasis on —— 更加重视',
        'zero-sum rivalry —— 零和式竞争',
        'league tables —— 排名表',
        'pools diverse perspectives —— 汇集多元视角',
        'attaches too much weight to —— 过于看重'
      ]
    },
    analysis: [
      '第 1 段：题目覆盖学校、职场与日常生活，范文把重心收拢到 education systems，避免泛泛而谈。',
      '第 2 段：写竞争的功能时用「选拔不可避免」这一现实理由，比空谈「竞争激发潜能」更有说服力。',
      '第 3 段：用三个动词并列（breeds / discourages / erodes）铺陈危害，节奏紧凑。',
      '第 4 段：结论落在具体做法（设计奖励共同成果的任务），可迁移到多数教育类题目。'
    ],
    takeaways: [
      '题目范围过宽时（学校 + 职场 + 生活），主动收窄到一两个场景，论证反而更有力。',
      '三动词并列（breeds A, discourages B and erodes C）是 Task 2 的高效修辞，建议熟练使用。'
    ]
  },

  {
    id: 'c19-2-2',
    task: 2, book: 19, test: 2, kind: '同意与否',
    level: '易', topics: ['工作', '社会'],
    title: '缩短工作周，延长周末',
    titleEn: 'Should the working week be shorter and the weekend longer?',
    lead: '同意与否型：用「健康 + 生产率」论证支持，再让步指出轮班制行业的现实困难。',
    body: [
      '[[c|转述题目主张]]There are frequent calls for[[/c]] a shorter working week and a longer weekend. [[p|立场：大体同意 + 限定适用范围]]I broadly agree with this proposal, although its success would depend on the kind of work involved.[[/p]]',
      'The principal argument in favour is [[v|幸福感与生产率]]well-being and productivity[[/v]]. [[v|过度工作的员工]]Overworked employees[[/v]] are more likely to [[v|出错]]make errors[[/v]], [[v|请病假]]take sick leave[[/v]] and [[v|辞职]]quit[[/v]]; trials of four-day weeks in several countries have [[v|结果显示]]reported[[/v]] [[v|持平甚至更高的产出]]output that held steady or even rose[[/v]], because [[v|更充分的休息]]better rest[[/v]] [[v|提升专注度]]sharpens concentration[[/v]]. [[c|递进：补上宏观效益]]Moreover,[[/c]] longer weekends would [[v|促进家庭生活与休闲消费]]encourage family life and leisure spending[[/v]], which [[v|惠及更广泛的经济]]benefits the wider economy[[/v]]. Stress-related illness is now among the most common reasons for long-term absence, so the savings from a better rested workforce are not merely hypothetical. Japan and several European employers have already adopted shorter weeks precisely because they could not recruit staff under the old arrangements.',
      '[[c|让步段：指出反对意见]]The obvious objection is that[[/c]] fewer hours mean higher [[v|用工成本]]labour costs[[/v]] and [[v|缩短的营业时间]]reduced opening hours[[/v]], which would [[v|冲击]]hit[[/v]] [[v|小企业]]small businesses[[/v]] and [[v|按时计费的行业]]hourly-paid sectors[[/v]] hardest. In [[v|医院]]hospitals[[/v]] or [[v|养老院]]care homes[[/v]], [[v|人手配置]]staffing levels[[/v]] cannot simply be cut. Smaller firms often lack the capital to hire replacement staff, which means the same work has to be completed in less time.',
      'Nevertheless, I would argue that a shorter week is [[v|值得追求的目标]]a goal worth pursuing[[/v]], [[v|前提是分阶段灵活推进]]provided it is phased in flexibly[[/v]]: office-based employers could [[v|先行试点]]pilot it first[[/v]], while [[v|轮班制行业]]shift-based industries[[/v]] [[v|重新设计排班]]redesign rotas[[/v]]. [[p|总结句式：条件 + 结果]]If implemented with care, the reform could improve lives without sacrificing output.[[/p]] If the change is introduced gradually, firms can adjust staffing and pricing before any loss of output becomes visible.'
    ],
    notes: {
      pattern: [
        'I broadly agree …, although … would depend on … —— 同意与否题的稳妥表态。',
        'The obvious objection is that … —— 主动提出最强反对意见，显得思辨。',
        'If implemented with care, the reform could … without sacrificing … —— 结尾的条件式总结。'
      ],
      cohesion: [
        'There are frequent calls for… —— 引出社会呼声。',
        'Moreover, —— 补充宏观层面的好处。',
        'Nevertheless, I would argue that… —— 让步之后重申立场。'
      ],
      vocab: [
        'overworked employees —— 过度工作的员工',
        'take sick leave —— 请病假',
        'labour costs —— 用工成本',
        'hourly-paid sectors —— 按小时计酬的行业',
        'staffing levels —— 人手配置',
        'shift-based industries —— 轮班制行业'
      ]
    },
    analysis: [
      '第 1 段：题目极短，范文用 depend on the kind of work 把讨论范围限定住，避免泛论。',
      '第 2 段：核心论据是「休息好 → 出错少 → 产出不降」，有因果链且引用了四天工作制试验，具体可信。',
      '第 3 段：让步段精准指出医院、养老院这类无法减人手的行业，显示你考虑过例外。',
      '第 4 段：结论给出分行业、分阶段推进的方案，比「应该缩短」更成熟。'
    ],
    takeaways: [
      '工作类题目常用论证链：员工状态 → 出错率 / 离职率 → 企业产出 → 整体经济。',
      '让步段点名「例外行业」是低成本高回报的加分技巧。'
    ]
  },

  {
    id: 'c19-3-2',
    task: 2, book: 19, test: 3, kind: '同意与否',
    level: '易', topics: ['社会', '工作'],
    title: '每个人都应该为未来存钱',
    titleEn: 'Should everyone, including young people, save money for their future?',
    lead: '同意与否型：从「抵御风险」与「打开长期选项」两个角度立论，再让步谈低收入群体的现实。',
    body: [
      '[[c|转述题目]]It is often said that[[/c]] everyone, including young people, should [[v|养成储蓄习惯]]develop the habit of saving[[/v]] for the future. [[p|立场：同意，但加上适度限定]]I agree with this view, though I believe the amount saved should be proportionate to income.[[/p]]',
      'The main reason is [[v|抵御不确定性]]protection against uncertainty[[/v]]. [[v|意外开支]]Unexpected costs[[/v]] — a [[v|医疗账单]]medical bill[[/v]], a [[v|失业期]]period of unemployment[[/v]] — can [[v|把家庭推入债务]]push households into debt[[/v]] if there is [[v|没有缓冲]]no buffer[[/v]], and [[v|高息借贷]]high-interest borrowing[[/v]] [[v|使问题雪上加霜]]compounds the problem[[/v]]. [[c|递进：第二个理由]]Furthermore,[[/c]] saving [[v|开启长期可能性]]opens up long-term options[[/v]]: a [[v|首付]]deposit[[/v]], [[v|进修]]further study[[/v]] or [[v|创业]]starting a business[[/v]] all become realistic once [[v|有一笔本金]]some capital exists[[/v]]. Research on household finances repeatedly finds that a modest emergency fund is the strongest predictor of whether a family recovers from a financial shock. A person with savings can also choose a job for its prospects rather than its immediate salary, which tends to improve earnings over a whole career. Saving is therefore as much about freedom as it is about security.',
      '[[c|让步：照顾低收入群体]]Admittedly,[[/c]] for those on [[v|最低工资]]minimum wages[[/v]] or [[v|背负学生贷款的]]burdened by student loans[[/v]], saving can be [[v|不切实际的]]impractical[[/v]], and [[v|过度节俭]]excessive frugality[[/v]] may [[v|损害当下生活质量]]damage present well-being[[/v]] — a point that [[v|值得考虑]]deserves consideration[[/v]]. In such cases, government policy matters more than individual discipline, since wages and benefits determine how much is left over.',
      'In conclusion, I agree that saving for the future is important for people of all ages, because it [[v|既提供安全网又带来选择权]]provides both a safety net and greater choice[[/v]]. [[p|平衡式结尾：重定优先级]]That said, the priority should be to build the habit, not to maximise the sum:[[/p]] even [[v|小额定期储蓄]]modest regular contributions[[/v]], started early, [[v|因复利而增长]]grow through compound interest[[/v]] and [[v|培养自律]]instil discipline[[/v]]. Schools can help by teaching budgeting alongside mathematics, so that the habit is formed before the first salary arrives.'
    ],
    notes: {
      pattern: [
        'I agree …, though I believe … should be proportionate to … —— 同意的同时加限定，避免极端。',
        'That said, the priority should be to …, not to … —— 结尾重新界定优先级，体现思考深度。',
        'all become realistic once … —— once 引导条件，句式简洁。'
      ],
      cohesion: [
        'It is often said that… —— 引出普遍看法。',
        'Furthermore, —— 第二个理由。',
        'Admittedly, —— 让步段标志词。'
      ],
      vocab: [
        'develop the habit of saving —— 养成储蓄习惯',
        'push households into debt —— 使家庭陷入债务',
        'high-interest borrowing —— 高息借贷',
        'compounds the problem —— 使问题加重',
        'excessive frugality —— 过度节俭',
        'compound interest —— 复利'
      ]
    },
    analysis: [
      '第 1 段：题目包含 including young people，范文用 proportionate to income 回应，兼顾公平感。',
      '第 2 段：两个理由分别对应「防风险」与「争取机会」，是金钱类话题最通用的两条论证线。',
      '第 3 段：让步段照顾低收入与学生贷款人群，避免论证显得不食人间烟火。',
      '第 4 段：结论把重点从「存多少」转向「养成习惯」，立意升级。'
    ],
    takeaways: [
      '金钱 / 消费类题目万能双线：抵御风险（safety net） + 创造机会（options）。',
      'That said 是 Task 2 中很好用的「自我修正」连接词，放在结论段开头效果佳。'
    ]
  },

  {
    id: 'c19-4-2',
    task: 2, book: 19, test: 4, kind: '积极 / 消极',
    level: '中', topics: ['全球化', '环境'],
    title: '超市里的全球食品是好事吗',
    titleEn: 'Is buying food produced all over the world positive or negative?',
    lead: '积极消极型：先承认消费者选择变多，再从碳排放与小农生计两个层面论证总体消极。',
    body: [
      '[[c|现象引入]]Supermarkets in most countries now stock[[/c]] food [[v|来自世界各地]]sourced from all over the world[[/v]], [[v|不分季节]]regardless of season[[/v]]. [[p|立场：承认好处，判断总体消极]]While this abundance has clear benefits for consumers, I believe its overall impact is negative when environmental and social costs are taken into account.[[/p]]',
      'The most obvious advantage is [[v|选择多样与供应安全]]choice and security[[/v]]. Shoppers can buy [[v|反季的新鲜蔬果]]fresh produce out of season[[/v]], [[v|饮食结构更加多样]]diets become more varied[[/v]], and countries that [[v|无法自给自足]]cannot grow enough food domestically[[/v]] [[v|得以保障供应]]secure supplies[[/v]]. Trade also [[v|支撑出口国经济]]supports exporting economies[[/v]], [[v|创造就业]]creating jobs[[/v]] in regions where alternatives are few. For consumers in colder climates this has removed the seasonal monotony that once characterised winter diets.',
      '[[c|转折进入弊端]]The drawback, however, is that[[/c]] [[v|长途运输]]long-distance transport[[/v]] and [[v|冷藏供应链]]refrigerated supply chains[[/v]] [[v|产生大量碳排放]]generate substantial carbon emissions[[/v]], while [[v|为长途运输设计的包装]]packaging designed for long journeys[[/v]] adds to [[v|塑料废弃物]]plastic waste[[/v]]. Estimates suggest that transport accounts for a significant share of the emissions attributed to an average shopping basket. [[p|递进补充社会层面]]What is more,[[/p]] [[v|全球采购]]global sourcing[[/v]] can [[v|挤压小农利润]]squeeze small farmers[[/v]], who must [[v|与廉价进口品竞争]]compete with cheap imports[[/v]] and [[v|符合千里之外制定的标准]]meet standards set thousands of miles away[[/v]]. Supermarket buying power can also push growers towards monoculture, which reduces the resilience of local agriculture.',
      'On balance, I regard the trend as negative, [[v|并不是因为]]not because[[/v]] imported food is [[v|本质上不好]]inherently undesirable[[/v]], but because its [[v|真实成本]]true costs[[/v]] are [[v|没有计入价格]]left out of the price[[/v]]. [[p|对策型结尾]]Rather than banning imports, governments should[[/p]] [[v|要求更清晰的碳标签]]require clearer carbon labelling[[/v]] and [[v|扶持本地当季农产品]]support local seasonal produce[[/v]], so that convenience does not [[v|以地球为代价]]come at the planet’s expense[[/v]]. Consumers, meanwhile, can reduce the impact by choosing seasonal produce when it is available and treating imported goods as an occasional option rather than a default.'
    ],
    notes: {
      pattern: [
        'While this … has clear benefits, I believe … when … are taken into account. —— 立场 + 判断维度。',
        'not because … but because … —— 否定一个浅层理由、给出真正的理由，很有说服力。',
        'Rather than banning X, governments should Y —— 结尾用「不做极端 / 做建设性之事」的句式。'
      ],
      cohesion: [
        'Supermarkets in most countries now stock… —— 具体场景开头。',
        'The drawback, however, is that… —— 转折进入弊端。',
        'On balance, I regard the trend as… —— 结论段开头的权衡表达。'
      ],
      vocab: [
        'sourced from all over the world —— 来自世界各地的',
        'regardless of season —— 不分季节',
        'refrigerated supply chains —— 冷藏供应链',
        'plastic waste —— 塑料废弃物',
        'squeeze small farmers —— 挤压小农的生存空间',
        'come at the planet’s expense —— 以环境为代价'
      ]
    },
    analysis: [
      '第 1 段：把判断标准明说为 environmental and social costs，让后文的展开有据可依。',
      '第 2 段：好处写了消费者与出口国两端，兼顾需求侧与供给侧。',
      '第 3 段：弊端同样分环境（碳排放、包装）与社会（小农）两层，与前段形成对称。',
      '第 4 段：用 not because…but because… 精确界定自己的判断，再给出碳标签与本地农业两项对策。'
    ],
    takeaways: [
      '全球化 / 环境类题目可从「消费者、生产者、环境」三方各写一句，结构立刻完整。',
      'not because A but because B 是提升结论段质量的高性价比句式。'
    ]
  },

  /* ============================================================
   *  TASK 1 · 图表描述（12 篇）
   * ============================================================ */

  {
    id: 'c17-1-1',
    task: 1, book: 17, test: 1, kind: '地图',
    level: '易', topics: ['城市规划', '环境'],
    title: '诺比顿工业区的改造规划',
    titleEn: 'Norbiton industrial area now and planned future development',
    lead: '地图题：先一句话概括「从工业用地转为教育 + 休闲用地」，再分述现状与规划。',
    body: [
      '[[c|地图题开头：说明两张图分别是什么]]The two maps illustrate[[/c]] an industrial area in the town of Norbiton as it is now and [[v|规划中的未来开发方案]]the planned future development of the site[[/v]].',
      '[[p|总体概括句（地图 / 流程图 / 所有 Task 1 必备）]]Overall, the site will change from industrial to educational and recreational use,[[/p]] although the surrounding farmland, the river and the road linking the area to the town [[v|保持不变]]remain unchanged[[/v]]. The overall footprint of the site, however, stays exactly the same.',
      'At present, the site [[v|被…占据]]is occupied by[[/v]] a single large factory, [[v|坐落于]]situated[[/v]] beside the river and [[v|经一条道路与镇区相连]]connected to the town by a road[[/v]]. Farmland [[v|环绕]]surrounds[[/v]] the area to the north and east, and there is no public facility of any kind. The factory occupies the eastern half of the plot, and no housing or public buildings are located nearby.',
      '[[c|转入规划方案]]In the future plan,[[/c]] the factory [[v|被…取代]]is replaced by[[/v]] a school, which [[v|占据原厂区的大部分]]occupies most of the former industrial plot[[/v]], while a playground is [[v|增建在旁边]]added alongside it[[/v]]. The existing road is [[v|保留下来]]retained[[/v]], now giving access to both new buildings. Farmland continues to border the area on two sides, so the new facilities remain surrounded by open countryside.'
    ],
    notes: {
      pattern: [
        'The two maps illustrate A now and the planned future development of B —— 地图题标准首句。',
        'Overall, the site will change from X to Y use —— 一句话定性，阅卷人最先看这句。',
        'A is replaced by B, while C is added … —— 描述「拆 / 建 / 改」的核心句式。'
      ],
      cohesion: [
        'At present, —— 描述现状。',
        'In the future plan, —— 描述规划方案。',
        'although —— 把「未变的部分」带出来，体现观察完整性。'
      ],
      vocab: [
        'planned future development —— 规划中的未来开发',
        'is occupied by —— 被…占据',
        'situated beside —— 坐落于…旁',
        'is replaced by —— 被…取代',
        'recreational use —— 休闲用途',
        'remain unchanged —— 保持不变'
      ]
    },
    analysis: [
      '第 1 段：开头只做一件事——改述题目，不评价、不写数据。',
      '第 2 段：地图题的 Overall 段要给出「一句话定性」（工业 → 教育 / 休闲），并点明什么没有变。',
      '第 3 段：现状段按「主体建筑 + 方位 + 周边」写，方位词（beside / to the north / linking）是得分点。',
      '第 4 段：变化段用 replace / add / retain 三个动词就能覆盖绝大多数地图题。'
    ],
    takeaways: [
      '地图题动词库：replace / convert / demolish / add / extend / retain / realign。',
      '地图题方位库：beside, to the north of, in the centre of, linking A to B。'
    ]
  },

  {
    id: 'c17-2-1',
    task: 1, book: 17, test: 2, kind: '表格 + 图表',
    level: '中', topics: ['政府', '社会'],
    title: '某地警局预算的来源与去向',
    titleEn: 'Police budget 2017–2018: sources and spending',
    lead: '多图题：一张表讲「钱从哪来」，两张饼图讲「钱花到哪」，范文用两段分别处理。',
    body: [
      '[[c|多图题开头：分别说明每张图]]The table and charts give information about[[/c]] the police budget in one area of Britain in 2017 and 2018. [[p|点明两张图的分工]]The table shows where the funding came from, while the charts show how it was spent.[[/p]]',
      '[[p|总体概括句：先讲总额，再讲结构变化]]Overall, total funding rose slightly from £304.7 million to £318.6 million,[[/p]] and although [[v|中央拨款]]central government funding[[/v]] remained the largest single source, [[v|地方税收]]local taxes[[/v]] [[v|增长最为明显]]increased most sharply[[/v]]. In other words, the budget grew in total and became slightly less dependent on the centre.',
      '[[v|国家政府]]National government[[/v]] contributed £175.5 million in 2017 and slightly more, £177.8 million, in 2018, while income from local taxes [[v|从…攀升至…]]climbed from[[/v]] £91.2 million to £102.3 million. [[c|对比：引出变化最小的项]]By contrast,[[/c]] other sources such as grants were almost [[v|持平]]unchanged[[/v]], at £38 million and £38.5 million respectively.',
      '[[c|切换到第二组图]]With regard to spending,[[/c]] [[v|警官与员工的薪酬]]salaries for officers and staff[[/v]] [[v|占最大份额]]accounted for the largest share[[/v]], although this [[v|从 75% 降至 69%]]fell from 75% to 69%[[/v]]. [[p|因果句式：A 省下的钱流向 B]]The money released went mainly on technology, which[[/p]] [[v|几乎翻倍]]almost doubled, rising from 8% to 14%[[/v]], while other costs [[v|稳定在 17%]]remained steady at 17%[[/v]]. Taken together, the figures point to a deliberate shift from staffing towards equipment.'
    ],
    notes: {
      pattern: [
        'The table shows where … came from, while the charts show how … was spent. —— 多图题开头模板。',
        'Total funding rose slightly from X to Y —— 总额变化的固定写法。',
        'The money released went mainly on …, which almost doubled —— 把两组数据用因果连起来，是高分特征。'
      ],
      cohesion: [
        'With regard to spending, —— 从「来源」切换到「支出」。',
        'By contrast, —— 突出变化最小的项目。',
        'respectively —— 两个主体对应两个数，避免重复句式。'
      ],
      vocab: [
        'total funding —— 经费总额',
        'central government funding —— 中央财政拨款',
        'climbed from … to … —— 从…攀升至…',
        'remained steady at —— 稳定在…',
        'accounted for the largest share —— 占最大份额',
        'the money released —— 被释放（省出来）的资金'
      ]
    },
    analysis: [
      '第 1 段：多图题必须在开头说清每张图讲什么，否则结构分会被扣。',
      '第 2 段：Overall 段给出总额变化 + 最大来源 + 变化最快项，三句话把全图讲完。',
      '第 3 段：三个来源按「金额从大到小」写，用 respectively 压缩句子长度。',
      '第 4 段：支出段抓住 salaries 下降、technology 上升这一对冲关系，语言效率高。'
    ],
    takeaways: [
      '表格 + 图表题：一图一段，Overall 段把两图串成一句因果或对比。',
      '百分比与绝对数混用时，务必区分 rise by 8%（增幅）与 rise to 8%（增至）。'
    ]
  },

  {
    id: 'c17-3-1',
    task: 1, book: 17, test: 3, kind: '柱状图',
    level: '中', topics: ['社会', '经济'],
    title: '家庭每周支出结构的五十年变迁',
    titleEn: 'Average weekly family spending, 1968 and 2018',
    lead: '双年对比柱状图：第二段用一句话概括「从必需品转向生活方式」，后两段分别写两个年份。',
    body: [
      '[[c|柱状图开头：对象 + 时间 + 单位]]The bar chart compares[[/c]] how families in one country [[v|分配每周收入]]spent their weekly income[[/v]] in 1968 and in 2018, [[v|分为八个类别]]across eight categories[[/v]].',
      '[[p|总体概括句：一句话概括五十年趋势]]Overall, spending shifted away from basic necessities towards lifestyle and mobility:[[/p]] the shares for food, housing, and fuel and power all [[v|下降]]declined[[/v]], whereas transport and leisure [[v|大幅上升]]rose substantially[[/v]].',
      'In 1968, food was [[v|遥遥领先的最大项]]by far the largest item[[/v]], [[v|约占三分之一]]accounting for roughly a third of weekly income[[/v]], followed by housing at around a fifth. Spending on fuel and power, clothing and footwear, household goods and personal goods each [[v|落在 7%–10% 区间内]]fell within the range of about 7% to 10%[[/v]]. Transport accounted for a relatively modest share, and leisure was the smallest category of all.',
      '[[c|进入第二个年份]]By 2018 the picture had changed considerably.[[/c]] Housing had become the single largest category, at just over a quarter of income, while transport and leisure together [[v|占到近三分之一]]made up close to a third[[/v]]. [[p|极值对比句式]]The most striking contrast is that[[/p]] the share spent on food had [[v|几乎减半]]almost halved[[/v]], whereas that on leisure had [[v|增长数倍]]increased several times over[[/v]]. By contrast, the proportions allocated to household goods and personal goods changed very little over the fifty years.'
    ],
    notes: {
      pattern: [
        'Overall, spending shifted away from A towards B —— 双年对比题的万能概括句。',
        'the shares for X, Y and Z all declined, whereas … rose substantially —— 三降一升的压缩写法。',
        'The most striking contrast is that … —— 突出最有戏剧性的变化。'
      ],
      cohesion: [
        'The bar chart compares how … in 1968 and in 2018 —— 双柱图开头。',
        'By 2018 the picture had changed considerably. —— 切换到第二个时间点。',
        'whereas —— 同句内的强对比。'
      ],
      vocab: [
        'basic necessities —— 基本生活必需品',
        'by far the largest item —— 遥遥领先的最大项',
        'fell within the range of —— 落在…区间内',
        'made up close to a third —— 占到近三分之一',
        'almost halved —— 几乎减半',
        'increased several times over —— 增长数倍'
      ]
    },
    analysis: [
      '第 1 段：改述题目时补上 eight categories，显示你已经看清图的结构。',
      '第 2 段：Overall 段用「必需品 → 生活方式」定性，后文所有细节都能挂在这个框架上。',
      '第 3 段：1968 年只写最大项与区间，不逐项罗列，避免流水账。',
      '第 4 段：2018 年聚焦「住房登顶、食物腰斩、休闲倍增」三个最有信息量的对比。'
    ],
    takeaways: [
      '双时间柱状图：Overall 段概括方向 → 一段写一个年份 → 段内只挑极值做对比。',
      'almost halved / doubled / tripled / increased several times over 是描述倍数变化的高效词。'
    ]
  },

  {
    id: 'c17-4-1',
    task: 1, book: 17, test: 4, kind: '线图',
    level: '中', topics: ['经济', '社会'],
    title: '关店潮与开店潮的背离',
    titleEn: 'Number of shop closures and openings, 2011–2018',
    lead: '双线图：抓住「一升一降、差距扩大、交叉点」三个特征，写法最省笔墨。',
    body: [
      '[[c|线图开头：对象 + 时间跨度]]The line graph shows[[/c]] the number of shops that closed and the number that opened in one country [[v|在 2011 至 2018 年间]]between 2011 and 2018[[/v]].',
      '[[p|总体概括句：两条线的关系]]Overall, there was a clear divergence between the two trends:[[/p]] closures [[v|呈上升态势]]followed an upward trend[[/v]], while openings [[v|逐步下滑]]fell away gradually[[/v]], so that the gap between them [[v|逐年拉大]]widened year by year[[/v]]. In other words, the retail landscape became progressively less dynamic over the period.',
      'In 2011, roughly 6,000 shops closed, [[v|略少于新开店铺数]]slightly fewer than the number that opened[[/v]]. Over the next eight years the figure for closures [[v|稳步攀升]]climbed steadily[[/v]] to [[v|接近 9,000 家]]close to 9,000[[/v]], [[v|在 2018 年达到峰值]]peaking at around that level in 2018[[/v]]. The increase was not entirely smooth, and there were brief periods when the number of closures levelled off.',
      '[[c|对比另一条线]]By contrast, the number of new shops[[/c]] [[v|从约 7,000 家降至略高于 3,000 家]]dropped from about 7,000 in 2011 to a little over 3,000 in 2018[[/v]], with the steepest fall [[v|出现在 2014 年之后]]occurring after 2014[[/v]]. [[p|交叉点句式（线图加分项）]]The two lines crossed[[/p]] in about 2013, after which closures consistently [[v|在数量上超过]]outnumbered[[/v]] openings. As a result, the total number of shops in operation fell, since new openings no longer compensated for closures.'
    ],
    notes: {
      pattern: [
        'Overall, there was a clear divergence between the two trends —— 双线图总体句模板。',
        'The two lines crossed in about 2013, after which A consistently outnumbered B —— 交叉点写法，极具画面感。',
        'with the steepest fall occurring after 2014 —— with + 名词 + 分词，补充细节的紧凑结构。'
      ],
      cohesion: [
        'Over the next eight years —— 时间推进。',
        'By contrast, —— 切换另一条线。',
        'after which —— 定语从句承接时间，写交叉 / 转折很自然。'
      ],
      vocab: [
        'a clear divergence —— 明显的背离',
        'followed an upward trend —— 呈上升趋势',
        'fell away gradually —— 逐步下滑',
        'climbed steadily —— 稳步攀升',
        'peaking at —— 在…达到峰值',
        'outnumbered —— 在数量上超过'
      ]
    },
    analysis: [
      '第 1 段：改述题目时保留 closed / opened 两个关键词，不要换成生僻同义词。',
      '第 2 段：Overall 段直接点出「背离」这一核心特征，后两段才有展开方向。',
      '第 3 段：上升线写起点、终点与峰值，三段式描述最清晰。',
      '第 4 段：下降线写幅度与最快区间，最后用交叉点收尾，是本篇最出彩的一句。'
    ],
    takeaways: [
      '线图必备动词：rise / fall / climb / drop / plateau / fluctuate / peak / bottom out。',
      '两条线有交点时一定要写：The two lines crossed …，几乎必然加分。'
    ]
  },

  {
    id: 'c18-1-1',
    task: 1, book: 18, test: 1, kind: '线图',
    level: '难', topics: ['城市规划', '社会'],
    title: '四国城市化率五十年与未来预测',
    titleEn: 'Percentage of population living in cities, four Asian countries',
    lead: '含预测段的线图：范文用 is projected to / is forecast to 区分「已发生」与「预测」，时态不混。',
    body: [
      '[[c|线图（含预测）开头]]The graph shows[[/c]] the percentage of the population living in cities in four Asian countries from 1970 to 2020, [[v|并给出 2030 与 2040 年的预测值]]with projections for 2030 and 2040[[/v]].',
      '[[p|总体概括句：共性 + 差异]]Overall, all four countries became increasingly urbanised, and this trend is expected to continue,[[/p]] although [[v|起点与增速]]the starting points and rates of growth[[/v]] differed considerably. By 2040, at least three of the four countries are expected to have more than 60% of their population living in cities.',
      'In 1970, [[v|各国的城市人口比例大致在 20%–30% 之间]]between roughly 20% and 30% of people in each country lived in cities[[/v]], with Malaysia and the Philippines [[v|处于该区间的较高一端]]at the upper end of this range[[/v]]. Malaysia then [[v|增长最为迅速]]grew most rapidly[[/v]], [[v|到 2020 年已远超 70%]]reaching well over 70% by 2020[[/v]] and [[v|预计到 2040 年将突破 80%]]is projected to exceed 80% by 2040[[/v]]. The sharpest increase occurred between 1990 and 2010, when Malaysia’s urban share grew by more than twenty percentage points.',
      'Indonesia, which began with [[v|最低的城市化率]]the lowest urban share[[/v]], [[v|后来居上]]caught up quickly[[/v]] and [[v|预计在 2040 年前超过 60%]]is forecast to pass 60% before 2040[[/v]]. Thailand and the Philippines, [[c|对比]]by contrast,[[/c]] [[v|增长较为平缓]]expanded more moderately[[/v]], [[v|最终落在 50%–60% 区间]]finishing in the region of 50% to 60%[[/v]]. Consequently, the gap between the most and least urbanised countries is projected to remain substantial in 2040.'
    ],
    notes: {
      pattern: [
        'Overall, all four … , and this trend is expected to continue —— 含预测图的总体句模板。',
        'A is projected to exceed 80% by 2040 —— 预测段专用：projected / forecast / expected to。',
        'which began with the lowest …, caught up quickly —— 定语从句 + 主句，写「逆转」很有效。'
      ],
      cohesion: [
        'with projections for 2030 and 2040 —— 点明图中包含预测数据。',
        'then —— 时间推进，避免反复写 in 1990, in 2000。',
        'by contrast, —— 把增速快的与增速慢的分开。'
      ],
      vocab: [
        'increasingly urbanised —— 城市化程度不断提高',
        'the starting points and rates of growth —— 起点与增速',
        'at the upper end of this range —— 处于该区间的上端',
        'is projected to —— 预计将（正式、图表常用）',
        'caught up quickly —— 迅速追上',
        'in the region of —— 大约、在…左右'
      ]
    },
    analysis: [
      '第 1 段：含预测的图必须在开头就说清哪一段是预测，否则后文时态无从判断。',
      '第 2 段：四条线的图，Overall 段要先说共性（都在涨）再说差异（起点与增速不同）。',
      '第 3 段：写最快的马来西亚，用过去时描述 1970–2020，用 projected to 描述 2040，时态分明。',
      '第 4 段：其余三国合并成一段，用「逆转型」（Indonesia）与「平缓型」（Thailand / Philippines）对比。'
    ],
    takeaways: [
      '预测数据一律用 is projected / forecast / expected to + 动词原形，不要混用将来时 will。',
      '多线图不要一条一段，按「最快 / 最慢 / 有逆转」分组写，控制段数。'
    ]
  },

  {
    id: 'c18-2-1',
    task: 1, book: 18, test: 2, kind: '柱状图',
    level: '中', topics: ['经济', '社会'],
    title: '美国家庭年收入分布的变化',
    titleEn: 'Number of US households by annual income, 2007 / 2011 / 2015',
    lead: '三组对比柱状图：Overall 段直接给出「高端增长最快」这一核心发现，后两段按收入档分述。',
    body: [
      '[[c|柱状图开头：对象 + 分组维度 + 年份]]The chart gives information on[[/c]] the number of US households [[v|按年收入分组]]grouped by annual income[[/v]] in 2007, 2011 and 2015.',
      '[[p|总体概括句：抓最有信息量的变化]]Overall, the number of households in the highest income bracket rose sharply,[[/p]] while those in the middle brackets [[v|变化相对有限]]changed comparatively little[[/v]], so that the distribution [[v|向高收入端拉长]]stretched towards the top end[[/v]]. The lowest bracket, meanwhile, remained large throughout.',
      '[[v|年收入低于 25,000 美元的家庭]]Households earning less than $25,000[[/v]] [[v|始终是最大的一组]]were the largest group in all three years[[/v]], at around 30 million, whereas the $50,000–$74,999 and $75,000–$99,999 bands each [[v|维持在 20 million 上下]]remained close to 20 million[[/v]]. The $25,000–$49,999 bracket [[v|同样保持稳定]]was similarly stable[[/v]]. Together, the three middle brackets accounted for a little over half of all households in each of the three years.',
      '[[c|突出最显著变化]]The most notable change concerns[[/c]] [[v|年收入 10 万美元及以上的家庭]]households with incomes of $100,000 or more[[/v]], whose numbers [[v|几乎翻倍]]roughly doubled over the period[[/v]], [[v|从约 15 million 增至近 30 million]]from about 15 million to nearly 30 million[[/v]]. [[p|对比收束]]By contrast,[[/p]] no other band [[v|增幅与之接近]]came close to matching this increase[[/v]]. This suggests that inequality between households widened, even though the lower income groups did not shrink in absolute terms.'
    ],
    notes: {
      pattern: [
        'Overall, the number of … rose sharply, while those in the middle brackets changed comparatively little —— 先说变再说不变。',
        'The most notable change concerns … —— 把读者注意力引向最重要的那组数据。',
        'whose numbers roughly doubled over the period —— whose 引导定语从句，写群体变化很顺。'
      ],
      cohesion: [
        'in all three years —— 概括三个时间点的共性。',
        'whereas / By contrast —— 段内外的对比连接。',
        'over the period —— 指代整个时间跨度，避免重复年份。'
      ],
      vocab: [
        'grouped by annual income —— 按年收入分组',
        'the highest income bracket —— 最高收入档',
        'the distribution stretched towards the top end —— 分布向高端拉长',
        'changed comparatively little —— 变化相对有限',
        'roughly doubled —— 几乎翻倍',
        'came close to matching —— 接近于（赶上）'
      ]
    },
    analysis: [
      '第 1 段：五个收入档 × 三个年份，信息量大，开头必须点清分组维度。',
      '第 2 段：Overall 段只讲一件事——最高档涨得最快，其余略过。',
      '第 3 段：把变化小的三档合并成一段，用 around / close to 做近似表达。',
      '第 4 段：单独一段写最高档的翻倍，形成「略写—详写」的节奏。'
    ],
    takeaways: [
      '多柱多组题：Overall 段「抓一头」，细节段「合并同类项」，是控制篇幅的关键。',
      '近似表达库：around / about / roughly / approximately / close to / in the region of。'
    ]
  },

  {
    id: 'c18-3-1',
    task: 1, book: 18, test: 3, kind: '平面图',
    level: '易', topics: ['教育', '城市规划'],
    title: '中央图书馆的二十年改造',
    titleEn: 'Central library floor plan: 20 years ago and today',
    lead: '平面图题：用「书架减少 → 数字设施与社交空间增加」一句话概括，再按空间顺序分述。',
    body: [
      '[[c|平面图题开头]]The diagrams show[[/c]] [[v|平面布局]]the floor plan[[/v]] of a public library twenty years ago and how it looks today.',
      '[[p|总体概括句：一句话定性改造方向]]Overall, the library has been substantially modernised:[[/p]] [[v|藏书空间]]shelving space[[/v]] has been reduced and largely replaced by [[v|数字设施与社交空间]]digital facilities and social areas[[/v]].',
      'Twenty years ago, the building [[v|以书架为主]]was dominated by bookshelves[[/v]], with adult fiction and non-fiction on one side and children’s books together with CDs, videos and computer games on the other. [[v|阅览室]]A reading room[[/v]] with newspapers and magazines [[v|占据中央]]occupied the centre[[/v]], and [[v|咨询台]]an enquiry desk[[/v]] handling tickets and book returns stood near the entrance. Seating was limited to the tables and chairs in the reading room, which suggests that the building was designed mainly for individual study.',
      '[[c|描述今日布局]]Today,[[/c]] [[v|所有参考书]]all reference books[[/v]] are [[v|集中在一处]]grouped together[[/v]], and the enquiry desk has [[v|让位于]]given way to[[/v]] an information desk and [[v|自助借还机]]self-service machines[[/v]]. [[p|新增设施总起句]]New features include[[/p]] a computer room, a café, a lecture room and [[v|讲故事活动区]]a storytelling area[[/v]], with sofas replacing the [[v|桌椅]]tables and chairs[[/v]] that once filled the reading room. Overall, the library now functions as a community hub rather than simply as a place to borrow books.'
    ],
    notes: {
      pattern: [
        'Overall, the library has been substantially modernised: … —— 平面图 / 地图题的定性句。',
        'A has given way to B —— 「被…取代」的地道表达，比 is replaced by 更书面。',
        'New features include A, B, C and D —— 列举新增设施的简洁句式。'
      ],
      cohesion: [
        'Twenty years ago, … Today, … —— 平面图题最清晰的时间分段。',
        'with adult fiction … on one side and … on the other —— 空间对仗。',
        'that once filled the reading room —— 定语从句点出「曾经」，突出变化。'
      ],
      vocab: [
        'floor plan —— 平面布局图',
        'was dominated by bookshelves —— 以书架为主',
        'shelving space —— 书架（藏书）空间',
        'occupied the centre —— 占据中央位置',
        'given way to —— 让位于、被…取代',
        'self-service machines —— 自助服务机'
      ]
    },
    analysis: [
      '第 1 段：平面图题与地图题写法一致，开头只改述不评价。',
      '第 2 段：Overall 段用「减少 vs 增加」的对仗把改造方向说透。',
      '第 3 段：旧布局按「左—右—中—入口」的空间顺序写，条理清楚。',
      '第 4 段：新布局抓住「合并、替换、新增」三类变化，信息密度高。'
    ],
    takeaways: [
      '平面图题照搬地图题结构：开头改述 → Overall 定性 → 一段过去 → 一段现在。',
      '写空间时用 on one side … on the other / in the centre / near the entrance 组织顺序。'
    ]
  },

  {
    id: 'c18-4-1',
    task: 1, book: 18, test: 4, kind: '线图',
    level: '难', topics: ['经济', '科技'],
    title: '三种金属 2014 年的月度价格变化',
    titleEn: 'Average monthly change in prices of copper, nickel and zinc (2014)',
    lead: '波动型线图：核心是「波动幅度」而非趋势，范文用 volatile / oscillated between 等词精准描述。',
    body: [
      '[[c|线图开头：注意单位是「月度变化率」]]The graph shows[[/c]] the [[v|平均月度价格变化]]average monthly change in prices[[/v]] of copper, nickel and zinc during 2014.',
      '[[p|总体概括句：波动型图要讲幅度]]Overall, nickel was by far the most volatile of the three metals,[[/p]] while copper and zinc [[v|波动幅度小得多]]fluctuated far less[[/v]], [[v|始终在正负几个百分点之内]]staying within a few percentage points of zero[[/v]]. In short, only one of the three metals experienced swings large enough to be described as significant. Only in the second half of the year did the three metals move in the same direction.',
      'Nickel prices [[v|年初小幅下跌]]fell slightly at the start of the year[[/v]], then [[v|急剧上扬]]rose sharply[[/v]] to [[v|超过 +8%]]over 8%[[/v]] around the middle of the year, before [[v|回落至负区间]]dropping back into negative territory[[/v]] towards December. From that peak, values moved erratically for several months before the decline began.',
      '[[c|对比另外两种金属]]Copper and zinc, by contrast,[[/c]] [[v|走势温和得多]]moved far more gently[[/v]]: both [[v|在约 +2% 与 −3% 之间震荡]]oscillated between roughly +2% and −3%[[/v]], and neither [[v|呈现出任何持续趋势]]showed any sustained trend[[/v]] during the twelve-month period. Zinc, however, spent slightly more of the year above zero than copper did, and finished marginally higher in December.'
    ],
    notes: {
      pattern: [
        'Overall, A was by far the most volatile of the three … —— 波动图的总体句模板。',
        'rose sharply to over 8%, before dropping back into negative territory —— before + 分词，写「先…后…」。',
        'both oscillated between X and Y, and neither showed any sustained trend —— both / neither 对称结构。'
      ],
      cohesion: [
        'then … before … —— 三段式时间推进（先…接着…随后…）。',
        'by contrast, —— 波动大的与波动小的分组对比。',
        'during the twelve-month period —— 概括整个观察期。'
      ],
      vocab: [
        'average monthly change —— 平均月度变化',
        'the most volatile —— 波动最剧烈的',
        'negative territory —— 负增长区间',
        'oscillated between … and … —— 在…之间震荡',
        'a sustained trend —— 持续性的趋势',
        'moved far more gently —— 走势温和得多'
      ]
    },
    analysis: [
      '第 1 段：这张图的纵轴是「月度变化百分比」而非价格本身，开头必须写准，否则全篇跑题。',
      '第 2 段：波动型图没有单一趋势，Overall 段就写「谁波动最大、谁最平稳」。',
      '第 3 段：镍的走势用「小幅下跌 → 急升 → 回落」三步写清，动词选择精准。',
      '第 4 段：铜与锌合并成一段，用 oscillated between 与 no sustained trend 概括全年。'
    ],
    takeaways: [
      '无趋势图（横盘震荡）专用词：fluctuate / oscillate / volatile / remain within a narrow band。',
      '描述「先升后降」：rose to …, before falling back to …；「先降后升」：fell to …, before recovering to …。'
    ]
  },

  {
    id: 'c19-1-1',
    task: 1, book: 19, test: 1, kind: '线图',
    level: '中', topics: ['社会', '健康'],
    title: '墨尔本某社区中心的活动参与变化',
    titleEn: 'Number of participants by activity, 2000–2020',
    lead: '五线图：范文不逐条罗列，而是按「增长最快 / 平稳 / 下滑」分成两组，重点突出。',
    body: [
      '[[c|线图开头：地点 + 对象 + 时间跨度]]The graph gives information on[[/c]] the number of participants in five activities at a social centre in Melbourne [[v|在 2000 至 2020 年间]]between 2000 and 2020[[/v]].',
      '[[p|总体概括句：多数上升 + 一个例外]]Overall, participation grew in most activities, most notably in martial arts,[[/p]] although [[v|业余戏剧]]amateur dramatics[[/v]] [[v|走向下滑]]went into decline[[/v]]. The centre therefore became considerably busier overall, even though not every activity benefited equally.',
      '[[v|武术]]Martial arts[[/v]] attracted about 30 participants in 2000 and [[v|稳步增至约 65 人]]rose steadily to roughly 65 by 2020[[/v]], [[v|成为最受欢迎的项目]]making it the most popular activity[[/v]]. Table tennis and musical performances also [[v|呈上升趋势]]followed upward trends[[/v]], [[v|分别从约 20 人和 15 人上升到约 45 人和 40 人]]climbing from around 20 and 15 to about 45 and 40 respectively[[/v]]. Growth was particularly rapid after 2010, when three of the five activities recorded their steepest increases. The film club, by comparison, never attracted more than a third of the numbers seen in martial arts.',
      '[[c|转折到例外项]]In contrast,[[/c]] amateur dramatics [[v|从约 40 人降至 25 人左右]]fell from approximately 40 participants to about 25[[/v]], while the film club [[v|保持相对稳定]]remained relatively stable[[/v]], [[v|全期在 30 至 35 人之间小幅波动]]fluctuating between 30 and 35 throughout the period[[/v]]. Amateur dramatics appears to have lost participants to the more physically active options on offer.'
    ],
    notes: {
      pattern: [
        'Overall, … grew in most activities, although X went into decline —— 多线图「多数 + 例外」模板。',
        'attracted about 30 participants in 2000 and rose steadily to roughly 65 by 2020 —— 起点 + 终点 + 方式，一句到位。',
        'climbing from around 20 and 15 to about 45 and 40 respectively —— 两组数据用 respectively 压缩。'
      ],
      cohesion: [
        'also followed upward trends —— 把同类项目合并叙述。',
        'In contrast, —— 引出走向相反的项目。',
        'throughout the period —— 强调全期稳定。'
      ],
      vocab: [
        'participation —— 参与人数',
        'went into decline —— 走向下滑',
        'the most popular activity —— 最受欢迎的项目',
        'remained relatively stable —— 保持相对稳定',
        'fluctuating between … and … —— 在…之间小幅波动',
        'respectively —— 分别地'
      ]
    },
    analysis: [
      '第 1 段：地点（Melbourne）+ 五个项目 + 20 年跨度，全部改述到位。',
      '第 2 段：五条线不能一条一段，Overall 段用「多数上升、一个下滑」立刻建立阅读框架。',
      '第 3 段：三个上升项目合并成一段，martial arts 详写、其余用 respectively 略写。',
      '第 4 段：下降项与平稳项各一句，用 In contrast 与 while 分得干净。'
    ],
    takeaways: [
      '多线图（4 条以上）务必分组：上涨组 / 下滑组 / 平稳组。',
      'respectively 一次可以省掉一整句重复，是控制字数的利器。'
    ]
  },

  {
    id: 'c19-2-1',
    task: 1, book: 19, test: 2, kind: '地图',
    level: '中', topics: ['城市规划', '环境'],
    title: '波特港的二十年蜕变',
    titleEn: 'Porth Harbour in 2000 and today',
    lead: '地图题：用「从作业港口转型为旅游休闲区」定性，再分述过去与现在，动词选择是得分点。',
    body: [
      '[[c|地图题开头]]The two plans illustrate[[/c]] Porth Harbour in 2000 and how it looks today.',
      '[[p|总体概括句：功能转型]]Overall, the harbour has been developed from a working port into a [[v|旅游与休闲兼用的区域]]combined leisure and tourist destination,[[/p]] although the [[v|公共海滩]]public beach[[/v]], the car park and the [[v|码头设施]]dock facilities[[/v]] [[v|被保留下来]]have been retained[[/v]]. The changes are concentrated around the waterfront, where most visitor facilities are now located.',
      'In 2000, the harbour [[v|主要服务渔船与客运渡轮]]served mainly fishing boats and passenger ferries[[/v]], with [[v|私人游艇码头]]a marina for private yachts[[/v]] [[v|紧邻一座废弃城堡]]next to a disused castle[[/v]]. Facilities for visitors were limited to showers and toilets, and the site was reached by a single road. There was no hotel, and nowhere for visitors to buy food or drink.',
      '[[c|描述今日变化]]Today, the marina has been enlarged and[[/c]] a hotel has been built [[v|在原城堡的旧址上]]on the site of the castle[[/v]], [[v|并配套咖啡馆与商店]]together with cafés and shops[[/v]]. [[p|补充细节句式]]Additional showers and toilets have been provided,[[/p]] while the [[v|救生艇站]]lifeboat station[[/v]] and the fishing area [[v|仍在原处]]remain in place[[/v]]. The ferry terminal has also been upgraded, reflecting the harbour’s growing role as a transport link for tourists.'
    ],
    notes: {
      pattern: [
        'Overall, the harbour has been developed from a working port into a leisure destination —— 功能转型句。',
        'A hotel has been built on the site of the castle —— on the site of 表达「在原址上新建」。',
        'Additional … have been provided, while … remain in place —— 新增与保留对举。'
      ],
      cohesion: [
        'In 2000, … Today, … —— 两图对照的最简分段法。',
        'with a marina … next to a disused castle —— with 结构补充方位信息。',
        'while —— 同句内对比「变了」与「没变」。'
      ],
      vocab: [
        'a working port —— 作业中的港口',
        'a leisure and tourist destination —— 休闲旅游目的地',
        'passenger ferries —— 客运渡轮',
        'a disused castle —— 废弃的城堡',
        'on the site of —— 在…的旧址上',
        'remain in place —— 保留在原处'
      ]
    },
    analysis: [
      '第 1 段：地图题开头 = 改述两图内容，不写任何判断。',
      '第 2 段：Overall 段定性为「功能转型」，同时点出保留项，信息完整。',
      '第 3 段：过去按「主体功能 + 配套设施 + 可达性」写，disused castle 这类细节是加分点。',
      '第 4 段：现在用 enlarge / build / provide 三个动词覆盖「扩建、新建、增配」。'
    ],
    takeaways: [
      '地图题的 Overall 段推荐句式：has been converted / developed / transformed from A into B。',
      '「保留不变」也要写：remain / be retained / be left unchanged，遗漏会扣分。'
    ]
  },

  {
    id: 'c19-3-1',
    task: 1, book: 19, test: 3, kind: '流程图',
    level: '易', topics: ['环境', '科技'],
    title: '乙醇（生物燃料）的生产流程',
    titleEn: 'How a biofuel called ethanol is produced',
    lead: '流程图：被动语态 + 顺序连接词是核心；范文用六步结构，每步一个动词，句句推进。',
    body: [
      '[[c|流程图开头：说明过程]]The diagram illustrates[[/c]] [[v|生物燃料乙醇的生产过程]]the process by which ethanol, a biofuel, is produced[[/v]].',
      '[[p|总体概括句：起点 + 终点 + 步数]]Overall, the process consists of six main stages,[[/p]] [[v|从植物生长开始，到产出乙醇结束]]beginning with the growth of plants and trees and ending with the production of ethanol[[/v]].',
      '[[c|第一步]]First,[[/c]] plants and trees [[v|吸收阳光与二氧化碳中的能量]]absorb energy in the form of sunlight and carbon dioxide[[/v]] and grow. Once they [[v|长成]]are fully grown[[/v]], they are harvested and then [[v|进入预处理]]undergo pre-processing[[/v]], [[v|在此阶段]]at which point[[/v]] [[v|纤维素]]cellulose[[/v]] is extracted and carbon dioxide is released. Sunlight and carbon dioxide therefore enter the process at the very beginning, long before any industrial stage takes place.',
      'The cellulose is then [[v|被进一步加工]]subjected to further processing[[/v]], which [[v|将其转化为糖分]]converts it into sugars[[/v]]. [[c|最后一步]]In the final stage,[[/c]] microbes are added, and after [[v|发酵]]fermentation[[/v]] the process [[v|产出乙醇]]yields ethanol[[/v]], with carbon dioxide again [[v|作为副产品被排出]]given off as a by-product[[/v]]. Because the carbon dioxide released at each stage was originally absorbed by the plants, the fuel is usually described as carbon neutral. The final product can then be blended with petrol for use in ordinary vehicles.'
    ],
    notes: {
      pattern: [
        'Overall, the process consists of N main stages, beginning with … and ending with … —— 流程图总体句模板。',
        'Once they are fully grown, they are harvested and then undergo … —— once 从句 + 被动语态。',
        'at which point … is extracted —— 定语从句说明「在这一步发生了什么」。'
      ],
      cohesion: [
        'First, … The … is then … In the final stage, … —— 流程顺序三段式。',
        'Once / after —— 时间与条件连接。',
        'with carbon dioxide again given off —— with 结构带出副产品。'
      ],
      vocab: [
        'the process by which … is produced —— …的生产过程',
        'consists of six main stages —— 由六个主要步骤组成',
        'absorb energy in the form of —— 以…形式吸收能量',
        'undergo pre-processing —— 进行预处理',
        'is subjected to further processing —— 被进一步加工',
        'given off as a by-product —— 作为副产品被排出'
      ]
    },
    analysis: [
      '第 1 段：流程图开头只需说明「这是什么过程」，无需任何数据。',
      '第 2 段：Overall 段给出步数与首末两端，让读者先有全局图。',
      '第 3 段：前三步（生长 → 收割 → 预处理）用 First / Once / then 串成一条线。',
      '第 4 段：后三步（加工 → 加菌发酵 → 产出）用 then / In the final stage 收束，并交代副产品。'
    ],
    takeaways: [
      '流程图 90% 的句子用被动语态：is harvested / is extracted / is converted / is added。',
      '顺序词库：first, then, next, after that, subsequently, in the final stage。'
    ]
  },

  {
    id: 'c19-4-1',
    task: 1, book: 19, test: 4, kind: '饼图 + 柱状图',
    level: '中', topics: ['教育', '社会'],
    title: '澳洲小镇青少年的舞蹈课地图',
    titleEn: 'Location and types of dance classes attended by young people',
    lead: '饼图 + 柱状图：饼图写「占比排序」，柱状图写「年龄组差异」，两段各抓一头。',
    body: [
      '[[c|双图开头：说明两张图的主题]]The two charts give information about[[/c]] where young people in a town in Australia attend dance classes and [[v|他们学哪类舞蹈]]which types of dance they study[[/v]].',
      '[[p|总体概括句：两图各一句]]Overall, most classes take place in private studios, and ballet is [[v|最受欢迎的舞种]]the most popular style[[/v]] in both age groups.[[/p]]',
      '[[v|就场地而言]]In terms of location,[[/v]] private studios [[v|占比接近一半，达 48%]]account for almost half of all classes, at 48%[[/v]], followed by school halls used after school (24%). [[v|社区活动中心及其他场所]]Community halls and other venues[[/v]] [[v|占 18%]]make up 18%[[/v]], while [[v|高校舞蹈教室]]college-based studios[[/v]] are [[v|最不常见]]the least common[[/v]], at 10%. Only a small minority of classes therefore take place on college premises, which are probably less accessible to younger children.',
      '[[c|切换到柱状图]]Looking at the types of dance,[[/c]] ballet attracts the largest number of students in both the under-11 and 11–16 groups, [[v|合计接近 700 人]]with close to 700 students in total[[/v]]. Tap and modern dance are considerably less popular, each [[v|吸引约 200 至 400 人]]attracting between roughly 200 and 400 students[[/v]], and [[v|对现代舞的兴趣明显随年龄增长]]interest in modern dance rises noticeably with age[[/v]]. Ballet, by contrast, is markedly more popular among the younger group, which suggests that many children stop as they become teenagers.'
    ],
    notes: {
      pattern: [
        'Overall, most classes take place in …, and … is the most popular … in both age groups —— 双图题两句话各管一张图。',
        'account for almost half of all classes, at 48% —— 先概括再给精确值，读感最好。',
        'interest in … rises noticeably with age —— 描述「随年龄变化」的地道句式。'
      ],
      cohesion: [
        'In terms of location, —— 切换到场地维度。',
        'followed by … —— 饼图排序衔接词。',
        'Looking at the types of dance, —— 切换到第二张图。'
      ],
      vocab: [
        'account for almost half —— 占比接近一半',
        'followed by —— 其次是',
        'the least common —— 最不常见的',
        'considerably less popular —— 明显更不受欢迎',
        'with close to 700 students in total —— 合计接近 700 人',
        'rises noticeably with age —— 随年龄明显上升'
      ]
    },
    analysis: [
      '第 1 段：两张图主题不同（场地 / 舞种），开头必须分别点明。',
      '第 2 段：Overall 段一句一张图，是最稳妥的双图处理方式。',
      '第 3 段：饼图按占比从大到小写，每个数都用「概括词 + 精确值」的写法。',
      '第 4 段：柱状图重点写「两年龄组的共同点与差异」，最后一句点出现代舞随年龄上升。'
    ],
    takeaways: [
      '饼图必备表达：account for / make up / constitute / the largest proportion / the smallest share。',
      '柱状图含年龄分组时，务必比较组间差异（more popular among … / rises with age）。'
    ]
  }

  ];

  /* ------------------------------------------------------------
   *  话题标签（筛选器按此顺序渲染）
   * ------------------------------------------------------------ */
  window.IELTS_ESSAY_TOPICS = [
    '教育', '科技', '环境', '健康', '工作',
    '社会', '政府', '经济', '全球化', '城市规划'
  ];

  /* ------------------------------------------------------------
   *  通用写作思路（列表页与详情页共用）
   * ------------------------------------------------------------ */
  window.IELTS_ESSAY_GUIDE = {
    title: '雅思写作通用思路（Task 1 / Task 2 通用）',
    steps: [
      { h: '审题：圈出指令与限定词', p: 'Task 1 看图表类型、单位、时间；Task 2 判断题型（同意与否 / 双方讨论 / 利弊 / 原因影响），把 under 18、in your country 这类限定词圈出来，全程不脱离。' },
      { h: '列提纲：三分钟定结构', p: 'Task 1 = 开头改述 + 总体概括 + 两段细节；Task 2 = 开头表态 + 两个论证段 + 结论。提纲只写关键词，不写完整句子。' },
      { h: '开头段：改述 + 表态', p: '用同义替换改写题目，绝不照抄；Task 2 必须在开头段末给出清晰立场，含糊其辞会直接限制分数。' },
      { h: '主体段：主题句 + 解释 + 例子', p: '每段第一句是 Topic Sentence，随后 2–3 句解释「为什么」，再补一个具体例子（数据、场景、个人经历均可），最后一句回扣主题句。' },
      { h: '语言：宁准不炫', p: '优先保证语法与搭配正确；每篇用 2–3 个精准的高分词组、1 个复杂句式（强调句、倒装、虚拟语气）即可，堆砌生僻词反而扣分。' },
      { h: '收尾与检查：留 3–5 分钟', p: 'Task 1 检查是否漏掉主要趋势与单位；Task 2 检查立场是否前后一致。最后通读一遍时态、单复数与冠词。' }
    ]
  };
})();
