## 初始化配置文件

> npm init 

只是个demo文件，一直回车创建就行，或者 `npm init -y `直接创建。

## 安装依赖

> `npm install express`

使用的Node框架

> `npm install vue`

创建Vue实例

> `npm install vue-router`

实现路由控制

> `npm install vue-server-renderer`

提供实现服务端渲染的API

## 创建一个Node服务

- 在根目录创建一个server.js文件

```js
// 可以安装nodemon, 解决修改服务代码需要频繁重启服务
const express = require("express");
const app = express();

app.get('*', (request, response) => {
    response.end('hello, ssr');
})

app.listen(3001, () => {
    console.log('服务已开启')
})
```

- 方便后续开发，可以再package.json中添加一行启动命令

```js
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    // 添加的服务端启动命令
    "server": "node server.js"
 },
```

## 渲染页面

> 在上一步已经能成功渲染出文字，但是ssr并不是主要为了渲染文字，而是渲染一个html模板。那么，接下来，我们得告知浏览器，我们需要渲染的是html,而不只是text，因此我们需要<font color="dd0000">修改响应头</font>。同时，引入vue-server-renderer中的createRenderer对象，有一个<font color="dd0000">renderToString</font>的方法，可以<font color="dd0000">将vue实例转成html的形式</font>。（renderToString这个方法接受的第一个参数是vue的实例，第二个参数是一个回调函数，如果不想使用回调函数的话，这个方法也返回了一个Promise对象，当方法执行成功之后，会在then函数里面返回html结构。）修改server.js如下:

```js
const express = require("express");
const app = express();

const Vue = require("vue");
const vueServerRender = require("vue-server-renderer").createRenderer();

app.get('*', (request, response) => {
    const vueApp = new Vue({
        data:{
           message: "hello, ssr"
        },
        template: `<h1>{{message}}</h1>`
    });

    response.status(200);
    response.setHeader("Content-type", "text/html;charset-utf-8");
    vueServerRender.renderToString(vueApp).then((html) => {
        response.end(html);
    }).catch(err => console.log(err))
})

app.listen(3001, () => {
    console.log('服务已开启')
})
```

查看页面源代码，可以发现在源代码中，已经存在一个标签对h1，这就是html模板的雏形。同时，h1上面有一个属性：<font color="dd0000">data-server-rendered="true"</font>,那这个属性是干什么的呢？这个是一个标记，表明这个页面是由vue-ssr渲染而来的。不妨打开一些seo页面或者一些公司的网站，查看源代码，会发现，也是有这个标记。虽然h1标签对被成功渲染，但是我们发现这个html页面并不完整， 他缺少了文档声明,html标签，body标签，title标签等，所以需要创建一个html模板，将Vue实例挂载到html模板中，保证页面完整。

## 将Vue模板挂载到html模板中

- 创建index.html

```js
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello SSR</title>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

<font color="dd0000">body中的注释不能删掉，这是挂载的占位符,格式需要一模一样，不然报错`Content placeholder not found in template.`</font>

- 修改server.js，将html模板引进去。这里createRenderer函数可以接收一个对象作为配置参数。配置参数中有一项为template,这项配置的就是即将使用的Html模板。这个接收的不是一个单纯的路径，我们需要使用fs模块将html模板读取出来

```js
const path = require('path');

const VueServerRender = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync(path.join(__dirname,"./index.html"),"utf-8")
});
```

重启服务，查看页面源码就是一个完整的HTML页面了。

## 创建Vue项目的目录结构

- 创建目录结构

```js
| src
|
|-- router
|     |-- index.js
|
| app.js
```

- src/router/index.js文件

```js
const vueRouter = require('vue-router');
const Vue = require('vue');

// 将引入的router注册成Vue插件
Vue.use(vueRouter);

module.exports = () => {
  // 编写配置，生成Vue实例
  return new vueRouter({
    mode: 'history',
    routes: [
      {
        path: '/',
        name: 'home',
        component: {
          template: `<h1>this is homePage</h1>`
        }
      },
      {
        path: '/about',
        name: 'about',
        component: {
          template: `<h1>This is aboutPage</h1>`
        }
      }
    ]
  })

  // 在app.js的Vue实例配置中引入配置的router
}
```

- src/app.js文件

```js
const Vue = require('vue');
const createRouter = require('./router/index.js');

module.exports = () => {
  const router = createRouter();

  return new Vue({
    router,
    data: {
      message: 'Hello Vue SSR!'
    },
    template: `
      <div>
          <h1>{{message}}</h1>
          <ul>
              <li>
                  <router-link to="/">home</router-link>
              </li>
              <li>
                  <router-link to="/about">about</router-link>
              </li>
          </ul>
          <router-view></router-view>
      </div>
    `
  })
}
```

- 修改server.js文件
  1. 引入Vue实例构造函数（app.js）；
  2. 生成Vue实例；
  3. 将Vue实例模板通过 renderToString() 渲染到页面

```js
const express = require('express');
const app = express();

const vueApp = require('./src/app.js')

// node内置模块
const path = require('path');

const Vue = require('vue');
const VueServerRender = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync(path.join(__dirname,"./index.html"),"utf-8")
});

app.get('*', (request, response) => {
  // const vueApp = new Vue({
  //   data: {
  //     message: 'Hello Server!'
  //   },
  //   template: '<h1>{{ message }}</h1>'
  // });

  let vm = vueApp({});

  response.status(200);
  response.setHeader("Content-type", "text/html;charset-utf-8");

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
```

<font color="dd0000">重启服务，页面成功渲染，但是点击home、about地址栏变化，页面没有变化，这是因为将页面渲染的工作交给服务端，切换路由在前端执行，而服务端并没有接到渲染返回新页面的请求。</font>

## 实现服务端控制页面路由

- 修改 app.js 将 Vue 和 router 实例暴露出去

```js
const Vue = require('vue');
const createRouter = require('./router/index.js');

module.exports = (context) => {
  const router = createRouter();

  const app = new Vue({
    router,
    data: {
      message: 'Hello Vue SSR!'
    },
    template: `
      <div>
          <h1>{{message}}</h1>
          <ul>
              <li>
                  <router-link to="/">home</router-link>
              </li>
              <li>
                  <router-link to="/about">about</router-link>
              </li>
          </ul>
          <router-view></router-view>
      </div>
    `
  });
  return {
    app,
    router
  }
}
```

- 在 src 文件下创建 entry-server.js 文件，该文件为服务端入口文件，引入 app 实例

```js
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
```

<!-- - 在 src 文件夹下创建 entry-client.js 文件，该文件为客户端入口，负责将路由挂载到app里面

```js
const createApp = require("./app.js");
let { app,router } = createApp({});

router.onReady(() => {
    app.$mount("#app")
});
``` -->

- 修改 server.js 文件

```js
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
```

重启服务，刷新页面，路由可正常切换