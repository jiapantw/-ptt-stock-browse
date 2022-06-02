const path = require('path');
const views = require('koa-views');
const Koa = require('koa');
const logger = require('koa-logger');
const router = require('@koa/router')();
// const koaBody = require('koa-body');

const { fetch } = require('./crawler/detail.js');

const app = module.exports = new Koa();

const render = views(path.join(__dirname, '/views'), { extension: 'ejs' })

app.use(logger());
app.use(render);
// app.use(koaBody());

router
  .get('/alive', (ctx, next) => {
    ctx.status = 200
    ctx.body = 'alive'
  })
  .get(`/${encodeURI('盤中閒聊')}`, defaultBrowse)
  .get(`/${encodeURI('盤後閒聊')}`, defaultBrowse)

app.use(router.routes());

async function defaultBrowse(ctx) {
  const path = ctx.path
  await new Promise((resolve) => {
    fetch(path.replace('/', ''), async (result) => {
      await ctx.render('index', result);
      resolve()
    })
  })
}
