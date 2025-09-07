const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    proxy: {
      "^/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "^/uploads": {
        // ★ 썸네일/이미지 정적 파일 프록시
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
