import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'sosermin-mobile',
  webDir: 'www',
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['10.0.2.2', '127.0.0.1', 'localhost', '192.168.103.128']
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#ffffff",
      style: "LIGHT"
    }
  }
};

export default config;
