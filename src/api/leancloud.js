import AV from 'leancloud-storage';

AV.init({
  appId: "fXnYOxrBJqYINPMyp49sG3Sh-gzGzoHsz",
  appKey: "4vGgTvlU2vWsdjK4QxM9ArcB",
  serverURL: "https://fxnyoxrb.lc-cn-n1-shared.com"
});

export const LoveRecord = AV.Object.extend('LoveRecord');
export default AV;