const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const pages = {
  "ubi.png": "https://pt.wikipedia.org/wiki/Ficheiro:UBI_Logo_Symbol.png",
  "uporto.svg": "https://pt.wikipedia.org/wiki/Ficheiro:Universidade_do_Porto_logo.svg",
  "uc.svg": "https://pt.wikipedia.org/wiki/Ficheiro:Logo_Universidade_de_Coimbra.svg",
  "uminho.svg": "https://pt.wikipedia.org/wiki/Ficheiro:Logotipo_UMinho.svg",
  "iscte.svg": "https://pt.wikipedia.org/wiki/Ficheiro:ISCTE_-_Instituto_Universit%C3%A1rio_de_Lisboa_logo.svg",
  "ist.svg": "https://pt.wikipedia.org/wiki/Ficheiro:IST_Logo.svg",
  "ucp.svg": "https://pt.wikipedia.org/wiki/Ficheiro:Universidade_Cat%C3%B3lica_Portuguesa_logo.svg",
  "fctnova.png": "https://pt.wikipedia.org/wiki/Ficheiro:Fct_nova_logo.png"
};

async function download() {
  for (const [name, pageUrl] of Object.entries(pages)) {
    try {
      const { data: html } = await axios.get(pageUrl);
      const $ = cheerio.load(html);
      let imgUrl = $('.fullImageLink a').attr('href');
      if (imgUrl) {
         if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
         console.log(`Downloading ${name} from ${imgUrl}`);
         const response = await axios({ url: imgUrl, responseType: 'stream' });
         response.data.pipe(fs.createWriteStream('public/logos/' + name));
      } else {
         console.log(`Could not find real image URL on page for ${name}`);
      }
    } catch (e) {
      console.log('Failed', name, e.message);
    }
  }
}
download();
