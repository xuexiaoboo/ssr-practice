const express = require('express');
const app = express();

// const vueApp = require('./src/app.js')
const App = require('./src/entry-server.js');

// node内置模块
const path = require('path');

const Vue = require('vue');
const VueServerRender = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync(path.join(__dirname,"./index.html"),"utf-8")
});

app.get('*', async (request, response) => {
  // const vueApp = new Vue({
  //   data: {
  //     message: 'Hello Server!'
  //   },
  //   template: '<h1>{{ message }}</h1>'
  // });

  // let vm = vueApp({});

  response.status(200);
  response.setHeader("Content-type", "text/html;charset-utf-8");

  let { url } = request;
  console.log('requestUrl==>', url)

  // 查找url相对应的template
  let vm = await App({ url })

  VueServerRender.renderToString(vm).then(html => {
    response.end(html);
  }).catch(err => {
    console.log('ssr渲染报错====>', err);
  })
})

app.listen(3001, () => {
  // 服务启动后控制台执行
  console.log('server running!')
})