export default defineAppConfig({
  pages: [
    'pages/inbox/index',
    'pages/match/index',
    'pages/growth/index',
    'pages/mine/index',
    'pages/submit/index',
    'pages/trouble-detail/index',
    'pages/response-editor/index',
    'pages/rules/index',
    'pages/action-list/index',
    'pages/follow-up/index',
    'pages/drafts/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#7C9EFF',
    navigationBarTitleText: '烦恼交换',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8FAFF',
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#7C9EFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/inbox/index',
        text: '收件箱',
      },
      {
        pagePath: 'pages/match/index',
        text: '匹配池',
      },
      {
        pagePath: 'pages/growth/index',
        text: '成长',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
      },
    ],
  },
});
