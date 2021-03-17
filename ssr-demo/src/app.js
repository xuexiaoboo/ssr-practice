const Vue = require('vue');
const createRouter = require('./router/index.js');

module.exports = (context) => {
  const router = createRouter();

  const app = new Vue({
    router,
    data: {
      message: 'Hello Vue SSR!',
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