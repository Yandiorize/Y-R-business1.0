/* ============================================================
 *  阅读「原文定位」数据（剑 17 Test 1）
 *  ---------------------------------------------------------------
 *  结构：testId -> { 题号: pid }
 *  pid 为 reading.js 中 passage block 的稳定编号（跨篇连续）：
 *    Passage 1 → 0–7，Passage 2 → 8–22，Passage 3 → 23–32
 *  标注原则：定位到「答案依据所在的段落」，不硬编句子；
 *  多选 / 摘要选词题定位到题干依据所在段落；无把握的题不标。
 *  --------------------------------------------------------------- */
window.IELTS_READING_LOCATE = {
  'c17-1': {
    /* Passage 1 · London underground railway */
    1: 0,   /* population grew rapidly */
    2: 1,   /* relocate workers to suburbs */
    3: 1,   /* gained support amongst businessmen */
    4: 2,   /* difficulty raising funding */
    5: 2,   /* critical articles by the press */
    6: 3,   /* two-metre-deep layer of soil */
    7: 4,   /* world's first underground railway */
    8: 4,   /* first-day / first-year passenger numbers */
    9: 5,   /* ventilation shafts, smoke remained */
    10: 6,  /* cut and cover not an option → deep tunnel */
    11: 7,  /* tiny windows: not to look out */
    12: 7,  /* did not make a profit */
    13: 7,  /* Tuppenny Tube popular */

    /* Passage 2 · Stadiums */
    14: 8,  /* A：growing scepticism towards stadiums */
    15: 21, /* F：Freiburg figures / CO2 reduction */
    16: 18, /* E：hotels, retail, conference centres… */
    17: 16, /* D：suburban sites, parking, energy */
    18: 11, /* B：Arles became a fortress */
    19: 11, /* bullfights at Arles */
    20: 12, /* Verona famous for opera */
    21: 13, /* Lucca used as a salt depot */
    22: 13, /* Piazza dell'Anfiteatro shops and homes */
    23: 14, /* 20th-century vs ancient amphitheatres */
    24: 14,
    25: 18, /* advantages: mixed-use public facilities */
    26: 18,

    /* Passage 3 · To catch a king */
    27: 23, /* deal with the Scots */
    28: 23, /* sacrificed his father's principle */
    29: 23, /* Battle of Worcester */
    30: 23, /* huge sum offered for his capture */
    31: 23, /* refuge in France / wandered Europe */
    32: 24, /* asked Pepys to commit the story */
    33: 24, /* personal recollection */
    34: 24,
    35: 25, /* joys of the book / close to the action */
    36: 23, /* reviewer's main purpose */
    37: 25, /* examples of humour and detail */
    38: 28, /* uncomfortable truth about the escape */
    39: 31, /* Spencer the perfect person to pass it on */
    40: 30  /* the tantalising question left */
  }
};
