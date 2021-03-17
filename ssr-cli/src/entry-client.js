import createApp from "./main.js";
let {app,router} = createApp();

router.onReady(() => {
    app.$mount("#app");
});