const axios = require('axios');
const fs = require('fs');
async function testURL(url) {
  try {
     const res = await axios.head(url);
     return res.status === 200;
  } catch(e) { return false; }
}

const urls = [
  "https://upload.wikimedia.org/wikipedia/pt/a/af/UBI_Logo_Symbol.png",
  "https://upload.wikimedia.org/wikipedia/commons/4/41/Universidade_do_Porto_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Logo_Universidade_de_Coimbra.svg/256px-Logo_Universidade_de_Coimbra.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Logotipo_UMinho.svg/320px-Logotipo_UMinho.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/ISCTE_-_Instituto_Universit%C3%A1rio_de_Lisboa_logo.svg/320px-ISCTE_-_Instituto_Universit%C3%A1rio_de_Lisboa_logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/T%C3%A9cnico_Lisboa_Logo.svg/320px-T%C3%A9cnico_Lisboa_Logo.svg.png",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_NOVA.svg/320px-Logo_NOVA.svg.png",
  "https://upload.wikimedia.org/wikipedia/pt/thumb/9/91/UCP_Logo.png/320px-UCP_Logo.png"
];

async function run() {
  for (const url of urls) {
    console.log(url, await testURL(url) ? "OK" : "FAIL");
  }
}
run();
