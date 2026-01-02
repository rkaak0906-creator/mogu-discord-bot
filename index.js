const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// --- 데이터 파일 준비 ---
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "restaurants.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

function loadRestaurants() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRestaurants(list) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function mogu(text) {
  // 너무 과하지 않은 다정/쿨데레 톤
  return `🍜 ${text}`;
}

function makeListEmbed(list, title = "맛집 리스트") {
  const embed = new EmbedBuilder()
    .setTitle(`📌 ${title}`)
    .setDescription(
      list.length
        ? "필요하면 /맛집검색 으로 먼저 찾는 게 편해."
        : "아직 비어있어. /맛집추가 로 하나만 넣어줘."
    )
    .setColor(0xffa24a);

  if (list.length) {
    const lines = list.slice(0, 20).map((r, idx) => {
      const memo = r.memo ? ` · 메모: ${r.memo}` : "";
      return `**${idx + 1}. ${r.name}**  \n지역: ${r.area} · 장르: ${r.genre}\n_${r.review}_${memo}`;
    });
    embed.addFields({ name: "목록 (최대 20개 표시)", value: lines.join("\n\n") });
  }

  return embed;
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}

client.once("ready", () => {
  console.log("🍜 모구 준비 완료!");
});

// --- 슬래시 명령어 처리 ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = interaction.commandName;
  const list = loadRestaurants();

  if (cmd === "맛집추가") {
    const name = interaction.options.getString("이름", true).trim();
    const area = interaction.options.getString("지역", true).trim();
    const genre = interaction.options.getString("장르", true).trim();
    const review = interaction.options.getString("한줄평", true).trim();
    const memo = interaction.options.getString("메모", false)?.trim() || "";

    // 중복(이름+지역 기준) 방지
    const exists = list.some(
      (r) => normalize(r.name) === normalize(name) && normalize(r.area) === normalize(area)
    );
    if (exists) {
      return interaction.reply({
        content: mogu("그건 이미 저장돼 있어. (이름+지역이 같아)"),
        ephemeral: true,
      });
    }

    const item = {
      name,
      area,
      genre,
      review,
      memo,
      createdAt: new Date().toISOString(),
      createdBy: interaction.user.id,
    };

    list.push(item);
    saveRestaurants(list);

    const embed = new EmbedBuilder()
      .setTitle("✅ 맛집 저장했어")
      .setDescription(mogu("나중에 찾기 쉽게 정리해둘게."))
      .addFields(
        { name: "이름", value: name, inline: true },
        { name: "지역", value: area, inline: true },
        { name: "장르", value: genre, inline: true },
        { name: "한줄평", value: review }
      )
      .setColor(0x57f287);

    if (memo) embed.addFields({ name: "메모", value: memo });

    return interaction.reply({ embeds: [embed] });
  }

  if (cmd === "맛집삭제") {
    // 관리자 권한 체크
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if (!isAdmin) {
      return interaction.reply({
        content: mogu("이건 관리자만 할 수 있어."),
        ephemeral: true,
      });
    }

    const number = interaction.options.getInteger("번호", true);
    const idx = number - 1;

    if (idx < 0 || idx >= list.length) {
      return interaction.reply({
        content: mogu("그 번호는 없어. /맛집리스트 로 번호 확인해줘."),
        ephemeral: true,
      });
    }

    const removed = list.splice(idx, 1)[0];
    saveRestaurants(list);

    return interaction.reply(
      mogu(`삭제했어. **${removed.name}** (지역: ${removed.area}, 장르: ${removed.genre})`)
    );
  }

  if (cmd === "맛집검색") {
    const keyword = interaction.options.getString("키워드", true);
    const k = normalize(keyword);

    // 이름/지역/장르 중 하나만 맞아도 매칭 + 부분검색
    const results = list.filter((r) => {
      const name = normalize(r.name);
      const area = normalize(r.area);
      const genre = normalize(r.genre);
      return name.includes(k) || area.includes(k) || genre.includes(k);
    });

    if (!results.length) {
      return interaction.reply({
        content: mogu(`"${keyword}"로는 못 찾았어. 철자만 한번 확인해줘.`),
        ephemeral: true,
      });
    }

    const embed = makeListEmbed(results, `검색 결과: "${keyword}" (${results.length}개)`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (cmd === "맛집리스트") {
    const embed = makeListEmbed(list, `전체 맛집 리스트 (${list.length}개)`);
    return interaction.reply({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);