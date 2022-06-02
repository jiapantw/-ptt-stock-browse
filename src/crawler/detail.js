const Crawler = require('crawler');

const c = new Crawler({
    maxConnections: 1,
});

const allStockIds = require('../../data/stocks.json')
const allUsers = require('../../data/hot-users-2022-05-31.json')
const hotUsers = allUsers.filter(row => row.count1+row.count2 > 5000)

const re = new RegExp(allStockIds.join('|'), "g");

const baseUrl = 'https://www.ptt.cc'

const findUrl = (q, cb) => {
    c.queue([{
        uri: `${baseUrl}/bbs/Stock/search?q=${q}&page=1`,
        callback: (error, res, done) => {
            if (error) {
                console.log('findUrl error', error);
                throw error
            }
        
            const $ = res.$;
        
            const find = $('.r-ent').toArray().find(dom => {
                const aLink = $('.title > a', dom)
                const detailPath = aLink.attr('href')
                const title = aLink.text()
                var yyyymmdd = new Date().toLocaleDateString('sv').replaceAll('-', '/');

                if (title.match(yyyymmdd)) {
                    return true
                }
                return false
            })

            const aLink = $('.title > a', find)
            const detailPath = aLink.attr('href')
            cb(detailPath)

            done();
        }
    }]);
}

const detailCb = (path, cb) => {
    c.queue([{
        uri: `${baseUrl}${path}`,
        callback: (error, res, done) => {
            if (error) {
                console.log('detailPageCallback error', error);
                throw error
            }
        
            const $ = res.$;
            
            const result = {
                html: $.html(),
                article: {},
                push: [],
                stocks: []
            }
        
            const key = res.options.detailPath
            const author = $('#main-content > div:nth-child(1) > span.article-meta-value').text()
            const title = $('#main-content > div:nth-child(3) > span.article-meta-value').text()
            const postedAt = new Date($('#main-content > div:nth-child(4) > span.article-meta-value').text()).toISOString()
        
            result.article = {
                key,
                authorDetail: author,
                title,
                postedAt,
                crawled: 1
            }
        
            $('.push').toArray().forEach(dom => {
                const tag = $('.push-tag', dom).text().trim()
                const userid = $('.push-userid', dom).text().trim()
                const content = $('.push-content', dom).text().trim()
                const datetime = $('.push-ipdatetime', dom).text().trim()
        
                result.push.push({
                    articleKey: key,
                    tag,
                    userid,
                    content,
                    datetime
                })
        
                const stockIds = content.match(re) || []
        
                stockIds.forEach(id => {
                    let stock = result.stocks.find(row => row.id === id)
                    if (!stock) {
                        stock = {
                            id,
                            count: 0
                        }
                        result.stocks.push(stock)
                    }
                    stock.count++
                })
            })
        
            result.stocks.sort((a,b) => b.count - a.count)


            let table = `
<style>
@media only screen and (max-width: 1299px) {
aside.nav-left {
    max-width: 20px;
    opacity: 0.6;
    left: 0 !important;
    margin-left: 0 !important;
    background: #fff;
}
aside.nav-left:hover {
    max-width: inherit;
    opacity: 1;
}

aside.nav-right {
    max-width: 20px;
    opacity: 0.6;
    right: 0 !important;
    margin-right: 0 !important;
    background: #fff;
}
aside.nav-right:hover {
    max-width: inherit;
    opacity: 1;
}
}

aside.nav-left {
position: fixed;
top: 70px;
left: 3%;
margin-left: 20px;
width: 200px;
z-index: 999999;
align-self: flex-start;
flex: 0 0 auto;
overflow-y: auto;
max-height: 50%;
}


aside.nav-right {
position: fixed;
top: 70px;
right: 3%;
margin-right: 20px;
width: 200px;
z-index: 999999;
align-self: flex-start;
flex: 0 0 auto;
overflow-y: auto;
max-height: 50%;
}

.tr {
position: relative;
left: 0;
margin: 10px 0;
border: none;
font-size: 1.0em;
display: table-row;
border-left: 2px solid #e8e8e8;
text-indent: 10px;
cursor: pointer;
}

.tr:nth-child(2n) {
background-color:#EEE
}

.tr .td {
display: table-cell;
border: 1px;
}

</style>

<aside class="nav-right">
<div class="tr">
    上個月統計
</div>
<div class="tr">
    <div class="td">代號</div>
    <div class="td">提及次數</div>
</div>
`
            result.stocks.forEach(row => {
                table += `
                <div class="tr">
                    <div class="td">${row.id}</div>
                    <div class="td">${row.count}</div>
                </div>`
            })

            table += '</aside>'

            table += `
            <aside class="nav-left">
                <div class="tr">
                    上個月統計
                </div>
                <div class="tr">
                    <div class="td">userid</div>
                    <div class="td">出沒次數</div>
                </div>
            `


            hotUsers.forEach(row => {
                table += `
                <div class="tr">
                    <div class="td">${row.id}</div>
                    <div class="td">${row.count1}</div>
                </div>`
            })

            table += `
            <div class="tr">
                <div class="td">總推文人數</div>
                <div class="td">${allUsers.length}</div>
            </div>`

            table += '</aside>'

            result.html = result.html.replace('<body>', `<body>${table}`)
            result.html = result.html.replace(/push-userid">(.+?)\s/g, function(match, group1) {
                const user = allUsers.find(row => row.id === group1)
                if (user) {
                    let hotStyle = ''
                    if (hotUsers.find(row => row.id === user.id)) {
                        hotStyle = 'background-color: red;'
                    }
                    return `push-userid" title='${JSON.stringify({
                        '調查時間': '2022/05/01~2022/05/31',
                        '盤中出沒前數': user.count1,
                        '盤後出沒前數': user.count2,
                    }, null,2)}' style="${hotStyle}">${group1} `
                }
                return match
            })
            cb(result)
            done();
        }
    }]);
}
module.exports = {
    fetch: (q, cb) => {
        findUrl(q, (path) => {
            detailCb(path, cb)
        })
    }
}

