require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("맛집추가")
    .setDescription("맛집을 리스트에 추가해.")
    .addStringOption((o) =>
      o.setName("이름").setDescription("맛집 이름").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("지역").setDescription("예: 홍대, 강남, 성수").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("장르").setDescription("예: 일식, 고기, 카페").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("한줄평").setDescription("짧게 추천 포인트").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("메모").setDescription("선택: 웨이팅/팁 등").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("맛집삭제")
    .setDescription("[관리자] 맛집을 삭제해.")
    .addIntegerOption((o) =>
      o.setName("번호").setDescription("리스트 번호").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("맛집검색")
    .setDescription("이름/지역/장르로 맛집을 찾아줘.")
    .addStringOption((o) =>
      o.setName("키워드").setDescription("예: 성수 / 라멘 / 모츠나베").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("맛집리스트")
    .setDescription("저장된 맛집 리스트를 보여줘."),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("슬래시 명령어 등록 중...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("✅ 등록 완료!");
  } catch (err) {
    console.error(err);
  }
})();