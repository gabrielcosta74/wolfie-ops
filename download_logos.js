const axios = require('axios');
const fs = require('fs');

const logos = {
  "ubi.png": "https://upload.wikimedia.org/wikipedia/pt/a/af/UBI_Logo_Symbol.png",
  "uporto.svg": "https://upload.wikimedia.org/wikipedia/commons/4/41/Universidade_do_Porto_logo.svg",
  "uc.svg": "https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Universidade_de_Coimbra.svg",
  "uminho.svg": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Logotipo_UMinho.svg",
  "iscte.svg": "https://upload.wikimedia.org/wikipedia/commons/1/1a/ISCTE_-_Instituto_Universit%C3%A1rio_de_Lisboa_logo.svg",
  "ist.svg": "https://upload.wikimedia.org/wikipedia/pt/4/47/IST_Logo.svg",
  "fctnova.png": "https://upload.wikimedia.org/wikipedia/pt/2/23/Fct_nova_logo.png",
  "ucp.png": "https://upload.wikimedia.org/wikipedia/pt/9/91/UCP_Logo.png"
};

async function download() {
  for (const [name, url] of Object.entries(logos)) {
    try {
      const response = await axios({ url, responseType: 'stream' });
      response.data.pipe(fs.createWriteStream('public/logos/' + name));
      console.log('Downloaded', name);
    } catch (e) {
      console.log('Failed', name, e.message);
    }
  }
}
download();
