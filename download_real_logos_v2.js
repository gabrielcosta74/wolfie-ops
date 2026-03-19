const axios = require('axios');
const fs = require('fs');

const pages = {
  "ubi.png": "https://upload.wikimedia.org/wikipedia/pt/a/af/UBI_Logo_Symbol.png",
  "uporto.svg": "https://upload.wikimedia.org/wikipedia/commons/4/41/Universidade_do_Porto_logo.svg",
  "uc.svg": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Universidade_de_Coimbra.svg",
  "uminho.svg": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Logotipo_UMinho.svg",
  "iscte.svg": "https://upload.wikimedia.org/wikipedia/commons/1/1a/ISCTE_-_Instituto_Universit%C3%A1rio_de_Lisboa_logo.svg",
  "ist.svg": "https://upload.wikimedia.org/wikipedia/commons/e/e4/T%C3%A9cnico_Lisboa_Logo.svg",
  "ucp.png": "https://upload.wikimedia.org/wikipedia/pt/9/91/UCP_Logo.png",
  "fctnova.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Logo_NOVA.svg/320px-Logo_NOVA.svg.png",
  "fmul.png": "https://upload.wikimedia.org/wikipedia/pt/3/30/FMUL_Logo.png"
};

async function download() {
  for (const [name, imgUrl] of Object.entries(pages)) {
    try {
      console.log(`Downloading ${name} from ${imgUrl}`);
      const response = await axios({ 
        url: imgUrl, 
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      response.data.pipe(fs.createWriteStream('public/logos/' + name));
    } catch (e) {
      console.log('Failed', name, e.message);
    }
  }
}
download();
