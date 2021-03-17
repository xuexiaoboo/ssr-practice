## 项目创建

- 使用vue-cli脚手架创建项目(这里使用的vue-cli 2.x)

```
<!-- 初始化项目 -->
vue-cli 2.x ===> npm init webpack [项目名称]
vue-cli 3.x ===> npm create [项目名]

<!-- 补充安装依赖 -->
npm install vue-server-renderer
```

## 修改客户端 webpack 配置

修改 build/webpack.dev.conf.js 文件

```
<!-- 引入插件 -->
const vueSSRClientPlugin = require("vue-server-renderer/client-plugin")

<!-- 在 devWebpackConfig 中注册插件 -->
const devWebpackConfig = merge(baseWebpackConfig,{
  plugins:[
    new vueSSRClientPlugin()
  ] 
});
```

添加了这个配置以后，重新启动项目通过地址就可以访问到vue-ssr-client-manifest.json（http://localhost:8080/vue-ssr-client-manifest.json），页面中出现的内容就是所需要的client-bundle。

## 修改Vue相关文件

- 修改 src/router/index.js

```js

```

- 修改 main.js

```js
import Vue from 'vue'
import App from './App'
import router from './router'

Vue.config.productionTip = false

// new Vue({
//   el: '#app',
//   router,
//   components: { App },
//   template: '<App/>'
// })

export default (context) => {
  const app = new Vue({
    // el: '#app',
    router,
    components: { App },
    template: '<App/>'
  });
  return {
    router,
    app
  }
}
```

- 添加 src/entry-server.js

```js
import createApp from "./main.js";

export default (context) => {
  return new Promise((reslove,reject) => {
    let {url} = context;
    let {app,router} = createApp(context);
    router.push(url);
    router.onReady(() => {
      let matchedComponents = router.getMatchedComponents();
      if(!matchedComponents.length){
        return reject();
      }
      reslove(app);
    },reject)
  })
}
```

- 添加 src/entry-client.js

```js
import createApp from "./main.js";
let {app,router} = createApp();

router.onReady(() => {
    app.$mount("#app");
});
```

## 修改webpack客户端入口及输出

修改 build/webpack.base.conf.js 文件

```js
module.exports = {
  entry: {
    app: './src/entry-client.js'
  }
}
```

## 创建服务端 webpack 配置文件

- 创建 build/webpack.server.conf.js 文件，目的将插件vue-server-renderer/server-plugin引入server端执行。（之前在 build/webpack.dev.conf.js 引入了client-plugin 插件）

```js
const webpack = require("webpack");
const merge = require("webpack-merge");
const base = require("./webpack.base.conf");

//  手动安装
//  在服务端渲染中，所需要的文件都是使用require引入，不需要把node_modules文件打包
//  该库创建一个外部函数，node_modules在Webpack中捆绑时将忽略该函数
const webapckNodeExternals = require("webpack-node-externals");


const vueSSRServerPlugin = require("vue-server-renderer/server-plugin");

module.exports = merge(base,{
    //  告知webpack，需要在node端运行
    target:"node",
    entry:"./src/entry-server.js",
    devtool:"source-map",
    output:{
        filename:'server-buldle.js',
        libraryTarget: "commonjs2"
    },
    externals:[
        webapckNodeExternals()
    ],
    plugins:[
        new webpack.DefinePlugin({
            'process.env.NODE_ENV':'"development"',
            'process.ent.VUE_ENV': '"server"'
        }),
        new vueSSRServerPlugin()
    ]
});
```

- 创建 bundle/dev-server.js，拿到客户端和服务端的bundle文件以及读取到index.html中的模板用作渲染

```js
const serverConf = require("./webpack.server.conf");
const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

//  读取内存中的.json文件
//  这个模块需要手动安装
const Mfs = require("memory-fs");
const axios = require("axios");

module.exports = (cb) => {
    const webpackComplier = webpack(serverConf);
    var mfs = new Mfs();
    
    webpackComplier.outputFileSystem = mfs;
    
    webpackComplier.watch({},async (error,stats) => {
        if(error) return console.log(error);
        stats = stats.toJson();
        stats.errors.forEach(error => console.log(error));
        stats.warnings.forEach(warning => console.log(warning));
        //  获取server bundle的json文件
        let serverBundlePath = path.join(serverConf.output.path,'vue-ssr-server-bundle.json');
        let serverBundle = JSON.parse(mfs.readFileSync(serverBundlePath,"utf-8"));
        //  获取client bundle的json文件
        let clientBundle = await axios.get("http://localhost:8080/vue-ssr-client-manifest.json");
        //  获取模板
        let template = fs.readFileSync(path.join(__dirname,"..","index.html"),"utf-8");
        cb && cb(serverBundle,clientBundle,template);
    })
};
```

- 修改 index.html 文件

```js
// 添加ssr渲染的占位
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>ssr-cli</title>
  </head>
  <body>
    <div id="app">
      <!--vue-ssr-outlet-->
    </div>
    <!-- built files will be auto injected -->
  </body>
</html>

```

- 在根目录创建 server.js 文件，用于启动服务，并利用createBundleRenderer将两个Bundle和html模板渲染出来。

```js
const devServer = require("./build/dev-server.js");
const express = require("express");
const app = express();
const vueRender = require("vue-server-renderer");

app.get('*',(request,respones) => {
    respones.status(200);
    respones.setHeader("Content-Type","text/html;charset-utf-8;");
    devServer((serverBundle,clientBundle,template) => {
        let render = vueRender.createBundleRenderer(serverBundle,{
            template,
            clientManifest:clientBundle.data,
            //  每次创建一个独立的上下文
            renInNewContext:false
        }); 
        render.renderToString({
            url:request.url
        }).then((html) => {
            respones.end(html);
        }).catch(error => {
          respones.end(JSON.stringify(error));
        });
    });
})

app.listen(5001,() => {
    console.log("服务已开启")
});
```

- 在 package.json 中添加服务端启动命令

```
 "server": "node server.js"
```

## 启动项目

```
npm run dev

npm run server

<!-- 访问服务端地址 https://localhost: 5001 -->
```