const registerDatabase = require("../../models/register");
const { MessageActionRow, MessageButton } = require("discord.js");
const moment = require("moment")
moment.locale("tr")

module.exports.run = async (client, message, args, embed) => {
    if (!roles.registerStaff.some(rol => message.member.roles.cache.has(rol)) && !message.member.permissions.has('ADMINISTRATOR')) return message.reply({ content: `Bu işlemi yapabilmek için yeterli yetkiye sahip değilsin.` }).delete(10);
    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (roles.manRoles.some(role => member.roles.cache.has(role)) || roles.womanRoles.some(role => member.roles.cache.has(role))) return message.reply({ content: `Bu kişi sunucuya zaten kayıt edilmiş.` }).delete(10);
    args = args.filter(a => a !== "" && a !== " ").splice(1);
    let setName;
    let isim = args.filter(arg => isNaN(arg)).map(arg => arg.charAt(0).replace('i', "İ").toUpperCase() + arg.slice(1)).join(" ");
    let yas = args.filter(arg => !isNaN(arg))[0] || undefined;
    if (!member || !isim || !yas) return message.reply({ content: `Hatalı kullanım, doğrusu; \`${settings.bot.prefix}kayıt [@Rencia/ID] <isim> <yaş>\`` })
    if (message.author.id === member.id) return message.reply({ content: "Kendi üzerinde işlem uygulayamazsın." }).delete(10);
    if (!member.manageable) return message.reply({ content: `Bu kişi üzerinde işlem uygulayamazsın.` }).delete(10);
    if (message.member.roles.highest.position <= member.roles.highest.position) return message.reply({ content: `Bu kişi seninle aynı yetkide veya senden daha yüksek bir yetkiye sahip.` }).delete(10);
    setName = `${settings.guild.tagges.map(tag => member.user.tag.includes(tag)) ? settings.guild.nameTag : (settings.guild.defaultTag ? settings.guild.defaultTag : (settings.guild.defaultTag || ""))} ${isim} | ${yas}`;
    let nickData = {
        nick: setName,
        admin: message.author.id,
        gen: "null"
    };
    let registerMemberData = await registerDatabase.findOne({ guildID: message.guild.id, memberID: member.id });
    if (!registerMemberData) new registerDatabase({
        guildID: message.guild.id,
        memberID: member.id,
        nicks: []
    }).save().catch(() => { });
    let registerAdminData = await registerDatabase.findOne({ guildID: message.guild.id, memberID: message.author.id });
    if (!registerAdminData) new registerDatabase({
        guildID: message.guild.id,
        memberID: message.author.id
    }).save().catch(() => { });
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setLabel("♂️ Daemon")
                .setStyle("SECONDARY")
                .setCustomId("btnRegErkek"),
            new MessageButton()
                .setLabel("♀ Sheila")
                .setStyle("SECONDARY")
                .setCustomId("btnRegKadinBtn"),
        );
    member.setNickname(`${setName}`).catch(() => { });
    await message.reply({
        embeds: [embed.setDescription(`${member} üyesinin ismi başarıyla **${setName}** olarak değiştirildi.
    
    Toplam **${registerMemberData ? registerMemberData.nicks.length : 0}** isim kayıtı bulundu.
    
    ${registerMemberData ? registerMemberData.nicks.map(x => `\`• ${x.nick}\` (${x.gen.replace(`Erkek`, `<@&${roles.manRoles[0]}>`).replace(`Kız`, `<@&${roles.womanRoles[0]}>`)}) (<@${x.admin}>)`).slice(0, 10).join("\n ") : "Veri tabanında veri bulunamadı."}`)], components: [row]
    }).then(async (msg) => {
        const filter = (interaction) => interaction.user.id == message.author.id;
        let collector = msg.createMessageComponentCollector({ filter, componentType: 'BUTTON', max: 3, time: 30000 })
        collector.on("collect", async (button) => {
            if (button.customId == "btnRegKadin") {
                if (roles.manRoles.some(role => member.roles.cache.has(role)) || roles.womanRoles.some(role => member.roles.cache.has(role))) return;
                await register(member, message.author, "Kız", nickData, embed);
                button.update({ content: `${member}, başarıyla **kız** olarak kayıt edildi!`, embeds: [], components: [] })
            } else if (button.customID == "btnRegErkek") {
                if (roles.manRoles.some(role => member.roles.cache.has(role)) || roles.womanRoles.some(role => member.roles.cache.has(role))) return;
                await register(member, message.author, "Erkek", nickData, embed);
                button.update({ content: `${member}, başarıyla **erkek** olarak kayıt edildi!`, embeds: [], components: [] })
            }
        });
        collector.on("end", async (button) => {
            msg.delete()
        });
    });
};
exports.config = {
    category: "register",
    name: "kayıt",
    usage: `${settings.bot.prefix}kayıt [@Rencia/ID] <isim> <yaş>`,
    guildOnly: true,
    aliases: ["e", "k", "erkek", "kadın", "kız"],
};

async function register(member, author, gen, nickData, embed) {
    if (gen == "Kız") {
        await registerDatabase.updateOne({ memberID: author.id }, { $inc: { womanRegister: 1, totalRegister: 1 } });
        await member.setRole(roles.womanRoles).then(() => {
            if (settings.guild.tagges.some(tag => member.user.tag.includes(tag))) member.roles.add(roles.tagRole)
        })
        if (client.findChannel("kayıt-log")) client.findChannel("kayıt-log").send({
            embeds: [embed.setDescription(`
        ${author} (\`${author.id}\`) tarafından ${member} (\`${member.id}\`) **kız** olarak \`${moment(Date.now()).format("LLL")}\` tarihinde kayıt edildi.`)]
        });
    } else if (gen == "Erkek") {
        await registerDatabase.updateOne({ memberID: author.id }, { $inc: { manRegister: 1, totalRegister: 1 } });
        await member.setRole(roles.manRoles).then(() => {
            if (settings.guil.tagges.some(tag => member.user.tag.includes(tag))) member.roles.add(roles.tagRole)
        })
        if (client.findChannel("kayıt-log")) client.findChannel("kayıt-log").send({
            embeds: [embed.setDescription(`
        ${author} (\`${author.id}\`) tarafından ${member} (\`${member.id}\`) **erkek** olarak \`${moment(Date.now()).format("LLL")}\` tarihinde kayıt edildi.`)]
        });
    } else {
        console.log(`[!] Geçersiz 'gen'.`)
    }
    nickData.gen = gen;
    await registerDatabase.updateOne({ memberID: member.id }, { $push: { nicks: nickData } });
}
