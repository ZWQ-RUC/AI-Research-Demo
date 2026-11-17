// ============================================================================
// Yaolin Wonderland Authentic Cave Spline, 4 Cave Halls & 18 Scenic Spots
// ============================================================================
(function(global) {
  'use strict';

  // S-shaped spline control points from Entrance (South, bottom of minimap) to Hall 3 (North, top)
  const CAVE_CONTROL_POINTS = [
    { x:  0.0, y:  0.0, z:    6.0, radiusW:  9.5, heightH: 11.5 }, // Entrance mouth
    { x:  2.5, y: -0.4, z:  -22.0, radiusW: 11.5, heightH: 13.0 }, // Poet wall
    { x:  9.5, y: -0.8, z:  -58.0, radiusW: 15.5, heightH: 15.5 }, // Front Hall: Jiangnan Water Town (9.png)
    { x:  4.0, y: -0.5, z:  -92.0, radiusW: 11.5, heightH: 14.0 }, // Lion & Elephant Welcome Arch
    { x: 16.0, y:  0.2, z: -132.0, radiusW: 22.0, heightH: 26.0 }, // Hall 1: Fairy Gathering Dome
    { x: 24.0, y:  0.6, z: -172.0, radiusW: 25.0, heightH: 30.0 }, // Hall 1: Galaxy Waterfall (银河飞瀑, 7.png)
    { x: 11.0, y:  0.0, z: -212.0, radiusW: 20.0, heightH: 24.0 }, // Hall 1: Lingzhi Mountain & Penglai Palace
    { x: -6.0, y: -1.4, z: -252.0, radiusW: 17.5, heightH: 22.0 }, // Hall 2: Dragon Palace Canyon Entrance
    { x:-22.0, y: -2.2, z: -295.0, radiusW: 19.5, heightH: 25.0 }, // Hall 2: Underground River (地下河, 10.png)
    { x:-30.0, y: -1.5, z: -336.0, radiusW: 18.5, heightH: 24.0 }, // Hall 2: Yan Ziling Fishing & Lion Hall
    { x:-18.0, y: -0.4, z: -372.0, radiusW: 21.0, heightH: 27.0 }, // Hall 2: Sky-Supporting Jade Pillar (擎天玉柱)
    { x: -3.0, y:  1.2, z: -415.0, radiusW: 28.5, heightH: 31.0 }, // Hall 3: Thirty-Three Heavens (三十三重天, 8.png)
    { x:  9.0, y:  2.2, z: -458.0, radiusW: 29.0, heightH: 32.0 }, // Hall 3: Stone Forest & Sea Lion
    { x: 15.0, y:  2.6, z: -498.0, radiusW: 24.0, heightH: 28.0 }, // Hall 3: Yaolin Jade Peak (瑶琳玉峰)
    { x: 16.0, y:  2.8, z: -522.0, radiusW: 16.0, heightH: 20.0 }  // North sanctum end
  ];

  const CAVE_HALLS = [
    {
      id: 'hall0',
      tMin: 0.0,
      tMax: 0.21,
      title: '前 厅 · 江 南 水 乡',
      subtitle: '秀丽温婉的小洞厅'
    },
    {
      id: 'hall1',
      tMin: 0.21,
      tMax: 0.46,
      title: '第 一 洞 厅 · 仙 女 聚 会',
      subtitle: '穹顶高约 30 米，景观最集中'
    },
    {
      id: 'hall2',
      tMin: 0.46,
      tMax: 0.74,
      title: '第 二 洞 厅 · 龙 宫 峡 谷',
      subtitle: '地势跌宕，坑底有地下河出露'
    },
    {
      id: 'hall3',
      tMin: 0.74,
      tMax: 1.01,
      title: '第 三 洞 厅 · 三 十 三 重 天',
      subtitle: '全洞最大的洞厅，石笋层层叠叠'
    }
  ];

  // 18 Authentic Scenic Spots along the spline
  const SCENIC_SPOTS = [
    {
      index: 1,
      t: 0.025,
      lateralOffset: 0.0,
      lookYawOffset: 0.0,
      hallId: 'hall0',
      title: '瑶琳洞口 · 灵山幽风',
      desc: '瑶琳仙境纵深约1公里，洞内常年恒温17至18℃。刚踏入洞口，一股带着亿万年碳酸钙矿石气息的清凉幽风便迎面拂来。'
    },
    {
      index: 2,
      t: 0.068,
      lateralOffset: -2.2,
      lookYawOffset: -0.35,
      hallId: 'hall0',
      title: '柯约斋诗壁',
      desc: '左壁5.5米高的天然摩崖上镌刻着宋代诗人柯约斋描写瑶琳洞的七言律诗，古人将这座梦幻地穴赞为“壶中天”与“蓬莱岛”。'
    },
    {
      index: 3,
      t: 0.118,
      lateralOffset: 1.2,
      lookYawOffset: -0.12,
      hallId: 'hall0',
      title: '前厅 · 江南水乡',
      desc: '前厅不大，清水一汪一汪地卧在石间，秀丽温婉，像极了江南水乡。'
    },
    {
      index: 4,
      t: 0.182,
      lateralOffset: 0.0,
      lookYawOffset: 0.0,
      hallId: 'hall0',
      title: '狮象迎宾',
      desc: '进入第一洞厅的天然屏风石门，左侧一头蓬发雄狮昂首蹲踞，右侧一群长鼻古象列队相迎，守护着通往仙境的门户。'
    },
    {
      index: 5,
      t: 0.245,
      lateralOffset: -1.5,
      lookYawOffset: 0.15,
      hallId: 'hall1',
      title: '仙女聚会',
      desc: '步入高达30米的第一洞厅，豁然开朗如华美宫殿。穹顶钟乳石垂挂如璎珞，地上石笋亭亭玉立，彩灯映照下恰似群仙赴会。'
    },
    {
      index: 6,
      t: 0.288,
      lateralOffset: 2.0,
      lookYawOffset: -0.25,
      hallId: 'hall1',
      title: '广寒舞台',
      desc: '高居岩壁之上的层叠钙华石台，玉柱环列、烟岚缭绕，电影《初探瑶琳洞》中仙女起舞的经典镜头便取景于此。'
    },
    {
      index: 7,
      t: 0.335,
      lateralOffset: -1.0,
      lookYawOffset: 0.28,
      hallId: 'hall1',
      title: '银河飞瀑',
      desc: '瑶琳四大标志之一。高 7 米、宽 13 米的石瀑从洞顶倾泻而下，瀑下一潭碧水清如明镜。'
    },
    {
      index: 8,
      t: 0.372,
      lateralOffset: 1.8,
      lookYawOffset: 0.22,
      hallId: 'hall1',
      title: '水秋石柱',
      desc: '毗邻银河飞瀑的一根7米高秀丽石柱，由数万年滴水凝结而成，表面盘绕着天然螺纹，酷似九龙盘绕的汉白玉华表。'
    },
    {
      index: 9,
      t: 0.410,
      lateralOffset: -2.0,
      lookYawOffset: -0.3,
      hallId: 'hall1',
      title: '灵芝仙山',
      desc: '层层叠叠的伞状石幔宛如瑶池仙山，岩洞中藏有一只温润如玉的石蛙，与对面伏地石狮共同守卫着千年灵芝仙草。'
    },
    {
      index: 10,
      t: 0.448,
      lateralOffset: 0.5,
      lookYawOffset: 0.0,
      hallId: 'hall1',
      title: '蓬莱宫阙',
      desc: '第一洞厅尾端的重重石幕与钟乳石群交错掩映，五彩灯光穿透水汽，影影绰绰间恍若海上蓬莱仙境。'
    },
    {
      index: 11,
      t: 0.545,
      lateralOffset: -1.5,
      lookYawOffset: 0.06,
      hallId: 'hall2',
      title: '地下河',
      desc: '第二洞厅峡谷幽深，地下河在坑底出露，雨季流水淙淙，回声萦绕整个洞厅。'
    },
    {
      index: 12,
      t: 0.602,
      lateralOffset: 0.8,
      lookYawOffset: 0.32,
      hallId: 'hall2',
      title: '严子陵垂钓',
      desc: '幽深清泉畔伫立着一支修长石笋，酷似白须老翁临水独钓，桐庐百姓将其比作归隐富春江畔的东汉高士严子陵。'
    },
    {
      index: 13,
      t: 0.658,
      lateralOffset: -2.2,
      lookYawOffset: -0.28,
      hallId: 'hall2',
      title: '群狮厅',
      desc: '在一片洁白晶莹的石笋群中，大小五十余处奇石状若雄狮，或蹲、或跃、或抖鬣长吼，相互戏耍，生龙活虎。'
    },
    {
      index: 14,
      t: 0.715,
      lateralOffset: 1.0,
      lookYawOffset: -0.18,
      hallId: 'hall2',
      title: '擎天玉柱',
      desc: '瑶琳四大标志之一。屹立在第二洞厅尾部悬崖之上，高约14米、直径4米，顶天立地，大有“力拔山兮气盖世”之概。'
    },
    {
      index: 15,
      t: 0.798,
      lateralOffset: 1.2,
      lookYawOffset: -0.55,
      hallId: 'hall3',
      title: '三十三重天',
      desc: '石笋漫天，层层叠叠，一直叠到洞顶，彩灯一照气象壮阔，有人把它比作敦煌壁画。'
    },
    {
      index: 16,
      t: 0.855,
      lateralOffset: 2.2,
      lookYawOffset: 0.25,
      hallId: 'hall3',
      title: '石林迷宫',
      desc: '曲折栈道穿行于密集的钟乳石林之间，仙鹤舞步、孔雀开屏、奇花异草遍布四周，一步一景，令人目不暇接。'
    },
    {
      index: 17,
      t: 0.908,
      lateralOffset: -1.8,
      lookYawOffset: -0.25,
      hallId: 'hall3',
      title: '海狮接水',
      desc: '洞顶垂下一支冰棱状钟乳石，下方一尊石笋恰似仰首张口的海狮凌空接水，上下呼应，妙趣横生。'
    },
    {
      index: 18,
      t: 0.955,
      lateralOffset: 0.0,
      lookYawOffset: 0.0,
      hallId: 'hall3',
      title: '瑶琳玉峰',
      desc: '瑶琳四大标志之一，亦是瑶琳仙境的标志瑰宝。重约千斤的洁白石笋宛如一位身披白绸、手捧鲜花的女神，亭亭玉立。'
    }
  ];

  global.YaolinData = {
    CAVE_CONTROL_POINTS,
    CAVE_HALLS,
    SCENIC_SPOTS
  };
})(window);
