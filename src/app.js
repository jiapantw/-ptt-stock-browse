const path = require('path');
const views = require('koa-views');
const Koa = require('koa');

const { fetch } = require('./crawler/detail.js');

const app = module.exports = new Koa();


app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }));
app.use(async function(ctx) {
  const { url } = ctx.query || {}
  if (!url) return

  await new Promise((resolve) => {
    fetch(url, async (result) => {
      await ctx.render('index', result);
      resolve()
    })
  })
});