const vueRouter = require('vue-router');
const Vue = require('vue');

Vue.use(vueRouter);

module.exports = () => {
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
}