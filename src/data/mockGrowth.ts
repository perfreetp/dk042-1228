import type { GrowthData, RuleItem, UserProfile } from '@/types';

export const mockUserProfile: UserProfile = {
  id: 'me',
  nickname: '暖心小太阳',
  avatar: 'https://picsum.photos/id/1005/200/200',
  age: 25,
  gender: 'female',
  bio: '希望能给每个人带去一点点温暖 ☀️',
  helpCount: 47,
  thankedCount: 32,
  isPaused: false,
  blockedUsers: [],
};

export const mockGrowthData: GrowthData = {
  helpCount: 47,
  thankedCount: 32,
  resolveCount: 18,
  moodTrend: [
    { date: '06-08', mood: 3 },
    { date: '06-09', mood: 4 },
    { date: '06-10', mood: 3 },
    { date: '06-11', mood: 5 },
    { date: '06-12', mood: 4 },
    { date: '06-13', mood: 4 },
    { date: '06-14', mood: 5 },
  ],
  weeklyHelp: [
    { day: '周一', count: 3 },
    { day: '周二', count: 5 },
    { day: '周三', count: 2 },
    { day: '周四', count: 7 },
    { day: '周五', count: 4 },
    { day: '周六', count: 6 },
    { day: '周日', count: 3 },
  ],
};

export const mockRules: RuleItem[] = [
  {
    title: '🤝 互助原则',
    content:
      '这里是一个温暖的互助社区。每一个人都可能是倾诉者，也可能是倾听者。请记住：你收到的善意，也请传递给他人。',
  },
  {
    title: '📝 发帖须知',
    content:
      '1. 烦恼请尽量具体，便于他人理解和回应\n2. 请选择合适的主题分类\n3. 根据需要设置回复长度和截止时间\n4. 请不要发布任何包含个人隐私信息的内容',
  },
  {
    title: '💬 回应规范',
    content:
      '1. 认真阅读对方的烦恼再回应\n2. 选择合适的语气：温暖治愈/理性分析/鼓励打气/共情倾听\n3. 使用分段提示让回复更有条理\n4. 请不要说伤害性、评判性的话语\n5. 发送前请使用"自检"功能检查',
  },
  {
    title: '🎯 匹配规则',
    content:
      '- 同龄人：匹配±3岁范围内的用户\n- 有相似经历：基于主题标签匹配\n- 随机匹配：完全随机抽取\n- 每天最多匹配10个烦恼，避免精力透支',
  },
  {
    title: '⭐ 互动机制',
    content:
      '1. 收到回复后可以打分（1-5星）\n2. 可以标记回复中对你最有帮助的句子\n3. 可以发起一次回访，告知对方你的近况\n4. 可以把烦恼转化为可执行的行动清单',
  },
  {
    title: '🛡️ 安全保障',
    content:
      '- 所有内容匿名处理，保护隐私\n- 遇到不当内容可随时举报\n- 可以屏蔽不想再看到的用户\n- 随时可以暂停匹配功能\n- 严重违规将被永久封禁',
  },
  {
    title: '💚 心理援助',
    content:
      '如果你或你认识的人正在经历严重的心理困扰，请及时寻求专业帮助：\n全国心理援助热线：400-161-9995\n北京心理危机研究与干预中心：010-82951332\n生命热线：400-821-1215',
  },
];
