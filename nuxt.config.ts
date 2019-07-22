import path from 'path';
import fs from 'fs';

const serverConfig = {
  mode: 'spa',
  server: {} as any,
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Global CSS
  */
  css: [
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'nuxt-basic-auth-module',
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
  },
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
    }
  },
  basic: {
    name: 'admin',
    pass: 'gatito',
    // enabled: process.env.BASIC_ENABLED === 'true' // require boolean value(nullable)
    enabled: true,
  },
};

const keyPath = path.resolve(__dirname, 'server.key');
const certPath = path.resolve(__dirname, 'server.crt');
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  serverConfig.server.https = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

module.exports = serverConfig;
