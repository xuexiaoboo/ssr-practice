const createApp = require('./app.js');

module.exports = (context) => {
  return new Promise((reslove, reject) => {
    let { url } = context;
    
    let { app, router } = createApp(context);
    router.push(url);

    // router回调函数，当所有异步请求完成之后就会触发
    router.onReady(() => {
      // 返回目标位置或是当前路由匹配的组件数组 (是数组的定义/构造类，不是实例)。通常在服务端渲染的数据预加载时使用。
      let matchedComponents = router.getMatchedComponents();
      console.log('router onready====>', matchedComponents)
      if(!matchedComponents.length){
        return reject();
      }
      reslove(app);
    }, reject)
  })
}