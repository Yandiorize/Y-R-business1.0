/* ============================================================
 *  听力模块数据 · 剑 17 Test 1 Section 1（10 题填空）
 *  ---------------------------------------------------------------
 *  ⚠ 说明：原书音频与逐字稿受版权保护，当前环境也无法访问在线 TTS
 *    （Google / 微软通道均被阻断）生成 mp3。因此本文件提供一套
 *    「与剑 17 Test 1 Section 1 同构」的 10 题填空样题：
 *    · 题型、题量、笔记填空形式与原书一致
 *    · 脚本为原创对话，答案全部来自脚本本身
 *    · 若你有原书音频，把 mp3 放到 audio 字段指向的路径即可自动改用文件播放
 *    · 若你有原书原文，直接替换 script / groups / answers 三处即可
 *  ---------------------------------------------------------------
 *  结构：
 *    script  逐句脚本 [{ who, text }]，用于播放器「当前句」同步
 *    cloze   笔记填空行，{ t } 为文本、{ g } 为第几题空
 *    answers 标准答案（判分用）
 * ============================================================ */
window.IELTS_LISTENING = [
  {
    id: 'c17-1-s1',
    book: '剑17',
    test: 'Test 1',
    section: 'Section 1',
    title: 'Renting a holiday apartment',
    instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
    /* 有 mp3 时填这里（如 assets/audio/listening/c17-1-s1.mp3）；
       为空则播放器自动使用浏览器系统语音逐句朗读 */
    audio: '',
    meta: '10 题 · 对话 · 约 2 分钟',

    script: [
      { who: 'AGENT',    text: 'Good morning, Riverside Lettings. Emma speaking. How can I help you?' },
      { who: 'CUSTOMER', text: 'Hello. I am calling about the holiday apartment you advertised in the local paper.' },
      { who: 'AGENT',    text: 'Of course. Could I take your name first, please?' },
      { who: 'CUSTOMER', text: 'Yes, it is Henderson. That is H-E-N-D-E-R-S-O-N.' },
      { who: 'AGENT',    text: 'Thank you, Mr Henderson. The apartment is at 24 Mill Road.' },
      { who: 'CUSTOMER', text: 'Sorry, did you say Mill Road?' },
      { who: 'AGENT',    text: 'That is right. M-I-L-L. And the postcode is BH5 2OP.' },
      { who: 'CUSTOMER', text: 'Thank you. And how many bedrooms does the apartment have?' },
      { who: 'AGENT',    text: 'It has three bedrooms, and all of them have double beds.' },
      { who: 'CUSTOMER', text: 'That sounds good. When is it available from?' },
      { who: 'AGENT',    text: 'It is available from the fourteenth of June.' },
      { who: 'CUSTOMER', text: 'And what is the rent?' },
      { who: 'AGENT',    text: 'The rent is three hundred and twenty pounds per week.' },
      { who: 'CUSTOMER', text: 'Is there a deposit as well?' },
      { who: 'AGENT',    text: 'Yes, the deposit is five hundred pounds.' },
      { who: 'CUSTOMER', text: 'Does the kitchen have everything we need?' },
      { who: 'AGENT',    text: 'The kitchen has a cooker, and a washing machine is included as well.' },
      { who: 'CUSTOMER', text: 'Is there anywhere to park?' },
      { who: 'AGENT',    text: 'Yes, there is a garage space at the back of the building.' },
      { who: 'CUSTOMER', text: 'Perfect. What is the best number to contact you on?' },
      { who: 'AGENT',    text: 'You can reach me on 07700 900123.' },
      { who: 'CUSTOMER', text: 'Thank you very much. Goodbye.' },
      { who: 'AGENT',    text: 'Goodbye, and thank you for calling.' }
    ],

    groups: [
      {
        label: 'Questions 1–10',
        type: '笔记填空',
        mode: 'cloze',
        nos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        instruction: 'Complete the notes below. Write ONE WORD AND/OR A NUMBER for each answer.',
        cloze: [
          [{ t: 'Holiday apartment — enquiry notes' }],
          [{ t: 'Customer name: Mr ' }, { g: 1 }],
          [{ t: 'Address: 24 ' }, { g: 2 }, { t: ' Road' }],
          [{ t: 'Postcode: ' }, { g: 3 }],
          [{ t: 'Bedrooms: ' }, { g: 4 }],
          [{ t: 'Available from: ' }, { g: 5 }, { t: ' June' }],
          [{ t: 'Rent: £' }, { g: 6 }, { t: ' per week' }],
          [{ t: 'Deposit: £' }, { g: 7 }],
          [{ t: 'Kitchen: a ' }, { g: 8 }, { t: ' is provided' }],
          [{ t: 'Parking: a ' }, { g: 9 }, { t: ' space' }],
          [{ t: 'Contact number: ' }, { g: 10 }]
        ]
      }
    ],

    answers: {
      1: 'Henderson',
      2: 'Mill',
      3: 'BH5 2OP',
      4: 'three / 3',
      5: '14 / fourteenth',
      6: '320',
      7: '500',
      8: 'cooker',
      9: 'garage',
      10: '07700 900123'
    },

    /* v33：题号→原文句序号（0 起），由脚本原文与答案键直接导出（非编造），
       供交卷后成绩表点击定位到句。Q2 注：Mill 在第 4、5 句都出现，
       按填空语境“24 _ Road”取第 4 句。 */
    loc: { 1: 3, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16, 9: 18, 10: 20 }
  }
];
