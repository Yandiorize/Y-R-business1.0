/* ============================================================
 *  真题题库  ——  剑桥雅思 17 / 18 / 19 学术类（A类）写作真题
 *  文本来源：Cambridge IELTS 17/18/19 Academic 原书 PDF
 *  图表来源：原书对应页面渲染裁切（site/assets/charts/）
 * ============================================================ */
window.IELTS_PROMPTS = [
  /* ---------------- Cambridge IELTS 17 ---------------- */
  {
    id: 'c17-1-1', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 1', task: 1, minutes: 20, minWords: 150,
    kind: '地图 · Map', chart: 'assets/charts/c17_t1.png',
    stem: 'The maps below show an industrial area in the town of Norbiton, and planned future development of the site.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c17-1-2', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 1', task: 2, minutes: 40, minWords: 250,
    kind: '利弊权衡 · Advantages / Disadvantages', chart: null,
    stem: 'It is important for people to take risks, both in their professional lives and their personal lives.',
    question: 'Do you think the advantages of taking risks outweigh the disadvantages?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c17-2-1', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 2', task: 1, minutes: 20, minWords: 150,
    kind: '表格 + 图表 · Table & Charts', chart: 'assets/charts/c17_t2.png',
    stem: 'The table and charts below give information on the police budget for 2017 and 2018 in one area of Britain. The table shows where the money came from and the charts show how it was distributed.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c17-2-2', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 2', task: 2, minutes: 40, minWords: 250,
    kind: '原因 + 影响 · Causes & Effects', chart: null,
    stem: 'Some children spend hours every day on their smartphones.',
    question: 'Why is this the case? Do you think this is a positive or a negative development?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c17-3-1', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 3', task: 1, minutes: 20, minWords: 150,
    kind: '柱状图 · Bar Chart', chart: 'assets/charts/c17_t3.png',
    stem: 'The chart below gives information about how families in one country spent their weekly income in 1968 and in 2018.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c17-3-2', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 3', task: 2, minutes: 40, minWords: 250,
    kind: '双方讨论 · Discuss Both Views', chart: null,
    stem: 'Some people believe that professionals, such as doctors and engineers, should be required to work in the country where they did their training. Others believe they should be free to work in another country if they wish.',
    question: 'Discuss both these views and give your own opinion.',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c17-4-1', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 4', task: 1, minutes: 20, minWords: 150,
    kind: '线图 · Line Graph', chart: 'assets/charts/c17_t4.png',
    stem: 'The graph below shows the number of shops that closed and the number of new shops that opened in one country between 2011 and 2018.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c17-4-2', book: '剑17', bookFull: 'Cambridge IELTS 17 Academic',
    test: 'Test 4', task: 2, minutes: 40, minWords: 250,
    kind: '积极 / 消极 · Positive or Negative', chart: null,
    stem: 'Nowadays, a growing number of people with health problems are trying alternative medicines and treatments instead of visiting their usual doctor.',
    question: 'Do you think this is a positive or a negative development?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },

  /* ---------------- Cambridge IELTS 18 ---------------- */
  {
    id: 'c18-1-1', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 1', task: 1, minutes: 20, minWords: 150,
    kind: '线图 · Line Graph', chart: 'assets/charts/b18_t1.png',
    stem: 'The graph below gives information about the percentage of the population in four Asian countries living in cities from 1970 to 2020, with predictions for 2030 and 2040.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c18-1-2', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 1', task: 2, minutes: 40, minWords: 250,
    kind: '同意与否 · Agree or Disagree', chart: null,
    stem: 'The most important aim of science should be to improve people’s lives.',
    question: 'To what extent do you agree or disagree with this statement?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c18-2-1', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 2', task: 1, minutes: 20, minWords: 150,
    kind: '柱状图 · Bar Chart', chart: 'assets/charts/b18_t2.png',
    stem: 'The chart below shows the number of households in the US by their annual income in 2007, 2011 and 2015.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c18-2-2', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 2', task: 2, minutes: 40, minWords: 250,
    kind: '双方讨论 · Discuss Both Views', chart: null,
    stem: 'Some university students want to learn about other subjects in addition to their main subjects. Others believe it is more important to give all their time and attention to studying for a qualification.',
    question: 'Discuss both these views and give your own opinion.',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c18-3-1', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 3', task: 1, minutes: 20, minWords: 150,
    kind: '平面图 · Floor Plan', chart: 'assets/charts/b18_t3.png',
    stem: 'The diagram below shows the floor plan of a public library 20 years ago and how it looks now.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c18-3-2', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 3', task: 2, minutes: 40, minWords: 250,
    kind: '积极 / 消极 · Positive or Negative', chart: null,
    stem: 'In many countries around the world, rural people are moving to cities, so the population in the countryside is decreasing.',
    question: 'Do you think this is a positive or a negative development?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c18-4-1', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 4', task: 1, minutes: 20, minWords: 150,
    kind: '柱状图 · Bar Chart', chart: 'assets/charts/b18_t4.png',
    stem: 'The graph below shows the average monthly change in the prices of three metals during 2014.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c18-4-2', book: '剑18', bookFull: 'Cambridge IELTS 18 Academic',
    test: 'Test 4', task: 2, minutes: 40, minWords: 250,
    kind: '利弊权衡 · Advantages / Disadvantages', chart: null,
    stem: 'In many countries, people are now living longer than ever before. Some people say an ageing population creates problems for governments. Other people think there are benefits if society has more elderly people.',
    question: 'To what extent do the advantages of having an ageing population outweigh the disadvantages?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },

  /* ---------------- Cambridge IELTS 19 ---------------- */
  {
    id: 'c19-1-1', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 1', task: 1, minutes: 20, minWords: 150,
    kind: '线图 · Line Graph', chart: 'assets/charts/b19_t1.png',
    stem: 'The graph below gives information on the numbers of participants for different activities at one social centre in Melbourne, Australia for the period 2000 to 2020.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c19-1-2', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 1', task: 2, minutes: 40, minWords: 250,
    kind: '双方讨论 · Discuss Both Views', chart: null,
    stem: 'Some people think that competition at work, at school and in daily life is a good thing. Others believe that we should try to cooperate more, rather than competing against each other.',
    question: 'Discuss both these views and give your own opinion.',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c19-2-1', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 2', task: 1, minutes: 20, minWords: 150,
    kind: '地图 · Map', chart: 'assets/charts/b19_t2.png',
    stem: 'The plans below show a harbour in 2000 and how it looks today.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c19-2-2', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 2', task: 2, minutes: 40, minWords: 250,
    kind: '同意与否 · Agree or Disagree', chart: null,
    stem: 'The working week should be shorter and workers should have a longer weekend.',
    question: 'Do you agree or disagree?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c19-3-1', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 3', task: 1, minutes: 20, minWords: 150,
    kind: '流程图 · Process Diagram', chart: 'assets/charts/b19_t3.png',
    stem: 'The diagram below shows how a biofuel called ethanol is produced.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c19-3-2', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 3', task: 2, minutes: 40, minWords: 250,
    kind: '同意与否 · Agree or Disagree', chart: null,
    stem: 'It is important for everyone, including young people, to save money for their future.',
    question: 'To what extent do you agree or disagree with this statement?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  },
  {
    id: 'c19-4-1', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 4', task: 1, minutes: 20, minWords: 150,
    kind: '饼图 + 柱状图 · Pie & Bar', chart: 'assets/charts/b19_t4.png',
    stem: 'The charts below give information on the location and types of dance classes young people in a town in Australia are currently attending.',
    question: '',
    instruction: 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
  },
  {
    id: 'c19-4-2', book: '剑19', bookFull: 'Cambridge IELTS 19 Academic',
    test: 'Test 4', task: 2, minutes: 40, minWords: 250,
    kind: '积极 / 消极 · Positive or Negative', chart: null,
    stem: 'In many countries nowadays, consumers can go to a supermarket and buy food produced all over the world.',
    question: 'Do you think this is a positive or a negative development?',
    instruction: 'Give reasons for your answer and include any relevant examples from your own knowledge or experience.'
  }
];

/* 内置简明词典：粘贴纯单词时可自动补全中文释义 */
window.IELTS_DICT = {
  abandon: '放弃；抛弃', abstract: '抽象的；摘要', academic: '学术的', accelerate: '加速', accessible: '可获取的；易接近的',
  accommodate: '容纳；提供住宿', accompany: '陪伴；伴随', accumulate: '积累', accurate: '准确的', achieve: '实现；达成',
  acknowledge: '承认；致谢', adapt: '适应；改编', adequate: '充足的', adjacent: '毗邻的', adjust: '调整',
  administration: '管理；行政', adopt: '采用；收养', advocate: '提倡；拥护者', aesthetic: '美学的', aggregate: '总计；合计',
  agriculture: '农业', albeit: '尽管', allocate: '分配', alternative: '替代方案；可替代的', ambiguous: '模棱两可的',
  analyse: '分析', ancient: '古代的', annotate: '注释', annual: '年度的', apparent: '明显的',
  appeal: '吸引力；呼吁', appliance: '器具；家电', appreciate: '欣赏；感激', approach: '方法；接近', appropriate: '恰当的',
  approve: '批准；赞成', approximate: '大约的', architecture: '建筑学；建筑风格', assess: '评估', assign: '分配；指派',
  assume: '假定；承担', assure: '保证', attain: '达到；获得', attitude: '态度', attribute: '归因于；属性',
  authority: '权威；当局', available: '可获得的', aware: '意识到的', beneficial: '有益的', bias: '偏见',
  bond: '纽带；债券', boom: '繁荣', brief: '简短的', budget: '预算', bulk: '大量；主体',
  bureaucracy: '官僚体制', calculate: '计算', capability: '能力', capacity: '容量；能力', category: '类别',
  cease: '停止', challenge: '挑战', circumstance: '情况；环境', cite: '引用', clarify: '澄清',
  coherent: '连贯的', coincide: '同时发生；一致', collapse: '崩溃；倒塌', commence: '开始', commit: '承诺；犯（错）',
  commodity: '商品', compatible: '兼容的；相容的', compensate: '补偿', competent: '有能力的', compile: '编纂；汇编',
  complex: '复杂的', comply: '遵守', comprise: '包含；由…组成', compromise: '妥协', conceal: '隐藏',
  concentrate: '集中；专注', concept: '概念', conclude: '得出结论；结束', conduct: '进行；行为', confer: '授予；商议',
  confine: '限制', confirm: '确认', conflict: '冲突', conform: '符合；遵守', consequence: '后果',
  conserve: '保护；节约', considerable: '相当大/多的', consist: '由…组成', constant: '持续的；不变的', constitute: '构成',
  constrain: '限制；约束', consult: '咨询；查阅', consume: '消耗；消费', contemporary: '当代的；同时代的', contradict: '反驳；与…矛盾',
  contribute: '贡献；促成', controversial: '有争议的', conventional: '传统的；常规的', convey: '传达；运输', cooperate: '合作',
  coordinate: '协调', core: '核心', correspond: '对应；通信', criteria: '标准（复数）', crucial: '至关重要的',
  cumulative: '累积的', curb: '抑制', crucial2: '关键的', decline: '下降；婉拒', dedicate: '致力于',
  deficiency: '缺乏；不足', define: '定义',   demonstrate: '证明；展示', denote: '表示；指代', dense: '密集的', derive: '源于；获得', despite: '尽管', detect: '察觉；检测',
  determine: '决定；确定', deviation: '偏差', diminish: '减少；削弱', discipline: '学科；纪律', disclose: '揭露',
  discriminate: '歧视；区分', dismiss: '解雇；不予考虑', disparity: '差距；不一致', display: '展示', dispose: '处理；处置',
  dispute: '争议', disrupt: '扰乱', distinct: '明显不同的；清晰的', distinguish: '区分', distribute: '分发；分布',
  diverse: '多样的', document: '记录；文件', domestic: '国内的；家庭的', dominate: '主导', drastic: '剧烈的',
  duplicate: '复制；副本', durable: '耐用的', dwell: '居住', ecological: '生态的', economic: '经济的',
  efficient: '高效的', elaborate: '详尽的；精心制作的', elicit: '引出；诱出', eliminate: '消除', emerge: '出现',
  emphasis: '强调', empirical: '实证的', enable: '使能够', encounter: '遭遇；邂逅', endorse: '认可；背书',
  enhance: '提升', enormous: '巨大的', ensure: '确保', entail: '需要；牵涉', enthusiasm: '热情',
  environment: '环境', equip: '配备', equivalent: '等同的；等价物', essential: '必要的；本质的', establish: '建立',
  estimate: '估计', evaluate: '评估', evident: '明显的', evolve: '演变；进化', exceed: '超过',
  exclude: '排除', exhibit: '展出；表现', expand: '扩张', expenditure: '支出；开销', exploit: '开发；剥削',
  expose: '暴露；使接触', extend: '延伸；扩展', external: '外部的', extract: '提取；摘录', facilitate: '促进；使便利',
  factor: '因素', feature: '特征；以…为特色', fluctuate: '波动', formulate: '制定；构想', foundation: '基础；地基',
  fragment: '碎片；片段', framework: '框架；体系', function: '功能；运作', fundamental: '根本的；基本的', generate: '产生；生成',
  global: '全球的', gradual: '逐渐的', guarantee: '保证', habitat: '栖息地', hierarchy: '等级制度',
  hinder: '阻碍', hypothesis: '假设', identical: '完全相同的', identify: '识别；确认', ideology: '意识形态',
  ignore: '忽视', illustrate: '说明；举例', imitate: '模仿', implement: '实施；执行', implication: '含义；影响',
  impose: '强加；征收', incentive: '激励；动机', incidence: '发生率', income: '收入', incorporate: '纳入；合并',
  indicate: '表明；指出', individual: '个人；个体的', induce: '诱导；引起', inevitable: '不可避免的', infer: '推断',
  inflation: '通货膨胀', inherent: '固有的', inhibit: '抑制', initially: '最初', innovation: '创新',
  insight: '洞察力；见解', install: '安装', institute: '机构；建立', intense: '强烈的；激烈的', interpret: '解读；口译',
  intervene: '干预', intrinsic: '内在的；固有的', investigate: '调查', involve: '涉及；使参与', isolate: '隔离',
  justify: '证明…正当；辩解', launch: '发起；发射', legislation: '法规；立法', likewise: '同样地', limit: '限制',
  locate: '定位；位于', maintain: '维持；主张', major: '主要的；主修', manipulate: '操纵；控制', margin: '边缘；差额',
  mature: '成熟的', maximise: '使最大化', mechanism: '机制', medium: '媒介；中等的', mental: '心理的；精神的',
  minimise: '使最小化', monitor: '监控；监测', motive: '动机', mutual: '相互的', negotiate: '谈判；协商',
  nevertheless: '然而；不过', notion: '概念；看法', objective: '目标；客观的', obtain: '获得', obvious: '明显的',
  occupy: '占据；占用', occur: '发生', offset: '抵消', ongoing: '持续进行的', option: '选项；选择',
  outcome: '结果', overall: '总体的', overcome: '克服', parameter: '参数；限定因素', participate: '参与',
  perceive: '感知；认为', permanent: '永久的', persist: '坚持；持续存在', perspective: '视角；观点', phenomenon: '现象',
  physical: '身体的；物理的', policy: '政策', portion: '部分', potential: '潜力；潜在的', practical: '实际的；实用的',
  precede: '先于', precise: '精确的', predict: '预测', predominant: '占主导地位的', preliminary: '初步的',
  premise: '前提', prevalent: '普遍的', previous: '先前的', primary: '主要的；初级的', principle: '原则；原理',
  priority: '优先事项', procedure: '程序；步骤', proceed: '继续进行', process: '过程；加工', prohibit: '禁止',
  promote: '促进；推广', proportion: '比例', propose: '提议', prospect: '前景；可能性', prove: '证明',
  provide: '提供', pursue: '追求；从事', qualitative: '定性的', quantitative: '定量的', radical: '激进的；根本的',
  random: '随机的', range: '范围；变动', ratio: '比率', react: '反应', recover: '恢复；康复',
  reduce: '减少', reflect: '反映；思考', reform: '改革', regard: '看待；关于', regime: '制度；体制',
  region: '地区', regulate: '监管；调节', reinforce: '加强', reject: '拒绝；排斥', relate: '关联；叙述',
  relevant: '相关的', reliable: '可靠的', reluctant: '不情愿的', remedy: '补救措施；治疗', remote: '偏远的；远程的',
  remove: '移除', require: '需要；要求', research: '研究', reside: '居住；存在于', resist: '抵抗',
  resource: '资源', respond: '回应', restrict: '限制', retain: '保留；保持', reveal: '揭示',
  revenue: '收入；税收', reverse: '逆转；相反的', revise: '修订；复习', rigid: '僵化的；严格的', robust: '稳健的；强健的',
  rural: '农村的', satisfy: '满足', scarce: '稀缺的', seek: '寻求；试图', segment: '部分；细分',
  select: '选择', sequence: '顺序；序列', shift: '转变；轮班', significant: '显著的；重要的', similar: '相似的',
  simulate: '模拟', simultaneous: '同时发生的', scenario: '情景；设想', solely: '仅仅', solution: '解决方案',
  somewhat: '有点；稍微', sophisticated: '复杂的；先进的', specific: '具体的；特定的', specify: '明确说明', stable: '稳定的',
  statistics: '统计数据', status: '地位；状态', stimulate: '刺激；激发', strategy: '策略', structure: '结构',
  submit: '提交；屈服', subsequent: '随后的', subsidise: '补贴', substitute: '替代品；代替', sufficient: '充足的',
  suggest: '表明；建议', summarise: '总结', superior: '优于；上级的', supplement: '补充', supply: '供应',
  support: '支持', suppose: '假设；认为', surge: '激增', survey: '调查', survive: '幸存；存活',
  sustain: '维持；支撑', symbol: '象征；符号', synthesis: '综合；合成', tackle: '应对；解决', target: '目标；瞄准',
  tendency: '趋势；倾向', theory: '理论', thereby: '从而', threat: '威胁', thrive: '繁荣；茁壮成长',
  tolerate: '容忍', trace: '追踪；痕迹', tradition: '传统', transfer: '转移；转让', transform: '转变',
  transition: '过渡；转变', transmit: '传播；传输', trend: '趋势', trigger: '引发；触发', ultimate: '最终的；根本的',
  undergo: '经历', underlie: '构成…的基础', undertake: '承担；着手', uniform: '统一的；制服', unique: '独特的',
  unity: '统一；团结', universal: '普遍的', urban: '城市的', urge: '敦促；强烈欲望', utilise: '利用',
  vague: '模糊的', valid: '有效的；合理的', vary: '变化；不同', vast: '广阔的；巨大的', verify: '核实',
  version: '版本；说法', vice: '恶习；副的', violate: '违反', virtual: '虚拟的；事实上的', vital: '至关重要的',
  volume: '体积；音量；量', voluntary: '自愿的', vulnerable: '脆弱的；易受伤害的', welfare: '福利', widespread: '广泛的',
  yield: '产出；让步'
};

/* 示例词表（点击「载入示例」直接体验）。格式：word 词性 释义 | 例句（例句仅在答后反馈卡出现） */
window.IELTS_SAMPLE = [
  'abandon v 放弃；抛弃 | They had to abandon the ship when it started to sink.',
  'accommodate v 容纳；提供住宿 | The hotel can accommodate up to 500 guests.',
  'accumulate v 积累，积聚 | Dust accumulates quickly if you do not clean.',
  'adequate adj 足够的，充足的 | The food supply was adequate for the trip.',
  'advocate v 提倡，主张 | She advocates a healthier diet for children.',
  'analyse v 分析 | Scientists analysed the data from the experiment.',
  'beneficial adj 有益的，有利的 | Regular exercise is beneficial to your health.',
  'capacity n 容量；能力 | The stadium has a seating capacity of 60,000.',
  'coherent adj 连贯的，有条理的 | He gave a clear and coherent explanation.',
  'compensate v 补偿，弥补 | Nothing can compensate for the loss of time.',
  'controversial adj 有争议的 | The new policy proved highly controversial.',
  'conventional adj 传统的，常规的 | Conventional methods are not always the best.',
  'crucial adj 至关重要的 | Sleep is crucial for a child\'s development.',
  'decline v 下降；婉言谢绝 | The number of visitors declined last year.',
  'demonstrate v 证明，表明 | The study demonstrates a clear link between diet and health.',
  'diminish v 减少，削弱 | The medicine helped diminish the pain.',
  'distinct adj 明显不同的，清晰的 | There are two distinct cultures in the region.',
  'distribute v 分发；分布 | The charity will distribute food to the poor.',
  'diverse adj 多样的，不同的 | The city has a culturally diverse population.',
  'eliminate v 消除，排除 | We must eliminate errors before publishing.',
  'emerge v 出现，浮现 | New evidence emerged during the investigation.',
  'enhance v 提高，增强 | The app is designed to enhance learning.',
  'essential adj 必不可少的，本质的 | Water is essential for all living things.',
  'evident adj 明显的，显然的 | It was evident that she was unhappy.',
  'fluctuate v 波动，起伏 | Prices fluctuate with the season.',
  'fundamental adj 根本的，基本的 | Trust is fundamental to any relationship.',
  'generate v 产生，生成 | Wind turbines generate electricity.',
  'hinder v 阻碍，妨碍 | Bad weather hindered the rescue effort.',
  'implement v 实施，执行 | The school will implement the new rules next term.',
  'incentive n 激励，动机 | Tax cuts provide an incentive to invest.',
  'inevitable adj 不可避免的，必然的 | Change is inevitable in a growing company.',
  'inherent adj 固有的，内在的 | There is a risk inherent in the process.',
  'innovation n 创新，革新 | Technological innovation drives economic growth.',
  'interpret v 解释，解读 | How do you interpret this result?',
  'maintain v 维持；主张 | It is important to maintain a balanced diet.',
  'perspective n 观点，角度 | From my perspective, the plan is rather risky.',
  'prevalent adj 普遍的，流行的 | This disease is prevalent in tropical areas.',
  'proportion n 比例，部分 | A large proportion of the budget goes to salaries.',
  'reinforce v 加强，强化 | The walls were built to reinforce the structure.',
  'reluctant adj 不情愿的，勉强的 | He was reluctant to admit his mistake.',
  'significant adj 重要的，显著的 | There was a significant increase in sales.',
  'sophisticated adj 复杂的；先进的 | The software is highly sophisticated.',
  'stimulate v 刺激，激发 | The tax cut is meant to stimulate the economy.',
  'sufficient adj 充足的，足够的 | We have sufficient evidence to proceed.',
  'sustain v 维持，支撑 | The bridge is strong enough to sustain heavy loads.',
  'tendency n 趋势，倾向 | He has a tendency to forget small things.',
  'transform v 转变，改变 | The internet has transformed our daily lives.',
  'undergo v 经历，经受 | Patients undergo a series of medical tests.',
  'vulnerable adj 脆弱的，易受伤害的 | Children are vulnerable to infection.',
  'widespread adj 广泛的，普遍的 | There was widespread support for the proposal.'
];
