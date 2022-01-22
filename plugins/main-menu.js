let fs = require('fs')
let path = require('path')
let tags = {
    'main': 'Main',
    'absen': 'Absen',
    'admin': 'Admin',
    'group': 'Group',
    'internet': 'Internet',
    'tools': 'Tools',
    'tpd': 'Tugas Praktik Demonstrasi',
    'owner': 'Owner',
    'host': 'Host',
    'advanced': 'Advanced',
}
const defaultMenu = {
    before: `
┌「 *Botify* 」
│ %ucapan, %name!
│ 
│ Tanggal: *%week %weton, %date*
│ Tanggal Islam: *%dateIslamic*
│ Waktu: *%time*
│
│ Uptime: *%uptime (%muptime)*
│ Database: %rtotalreg of %totalreg
│ Github:
│ %github
└────
%readmore`.trimStart(),
    header: '┌「 *%category* 」',
    body: '├ %cmd',
    footer: '└────\n',
    after: `
*%npmname@^%version*
_%npmdesc_
`,
}

let handler = async (m, { conn, usedPrefix: _p }) => {
    try {
        let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'))
        let { registered } = db.data.users[m.sender]
        let name = registered ? db.data.users[m.sender].name : conn.getName(m.sender)
        let d = new Date(new Date + 3600000)
        let locale = 'id'
        // d.getTimeZoneOffset()
        // Offset -420 is 18.00
        // Offset    0 is  0.00
        // Offset  420 is  7.00
        let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
        let week = d.toLocaleDateString(locale, { weekday: 'long' })
        let date = d.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
        let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d)
        let time = d.toLocaleTimeString(locale, {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        })
        let _uptime = process.uptime() * 1000
        let _muptime
        if (process.send) {
            process.send('uptime')
            _muptime = await new Promise(resolve => {
                process.once('message', resolve)
                setTimeout(resolve, 1000)
            }) * 1000
        }
        let muptime = conn.clockString(_muptime)
        let uptime = conn.clockString(_uptime)
        let totalreg = Object.keys(db.data.users).length
        let rtotalreg = Object.values(db.data.users).filter(user => user.registered == true).length
        let help = Object.values(plugins).filter(plugin => !plugin.disabled).map(plugin => {
            return {
                help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
                tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
                prefix: 'customPrefix' in plugin,
                enabled: !plugin.disabled,
            }
        })
        for (let plugin of help)
            if (plugin && 'tags' in plugin)
                for (let tag of plugin.tags)
                    if (!(tag in tags) && tag) tags[tag] = tag
        conn.menu = conn.menu ? conn.menu : {}
        let before = conn.menu.before || defaultMenu.before
        let header = conn.menu.header || defaultMenu.header
        let body = conn.menu.body || defaultMenu.body
        let footer = conn.menu.footer || defaultMenu.footer
        let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
        let _text = [
            before,
            ...Object.keys(tags).map(tag => {
                return header.replace(/%category/g, tags[tag]) + '\n' + [
                    ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
                        return menu.help.map(help => {
                            return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                                .trim()
                        }).join('\n')
                    }),
                    footer
                ].join('\n')
            }),
            after
        ].join('\n')
        text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
        let replace = {
            '%': '%',
            p: _p, uptime, muptime,
            ucapan: conn.ucapan(),
            me: conn.user.name,
            npmname: package.name,
            npmdesc: package.description,
            version: package.version,
            github: package.homepage ? package.homepage.url || package.homepage : '[unknown github url]',
            name, weton, week, date, dateIslamic, time, totalreg, rtotalreg,
            readmore: readMore
        }
        text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
        conn.reply(m.chat, text.trim(), m)
    } catch (e) {
        conn.reply(m.chat, 'Maaf, menu sedang error', m)
        throw e
    }
}
handler.help = ['menu', 'help', '?']
handler.tags = ['main']
handler.command = /^(menu|help|\?)$/i

module.exports = handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)