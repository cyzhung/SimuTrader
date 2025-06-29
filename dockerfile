# 使用官方 Node.js 映像檔
FROM node:18

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝相依套件
RUN npm install

# 複製所有程式碼
COPY . .

# 如果你有啟動用環境變數，可加上 ENV
# ENV NODE_ENV=production

# 暴露應用程式的 port（根據實際情況設定）
EXPOSE 3000

# 啟動指令（請替換成你實際的啟動方式）
CMD [ "node", "backend/" ]


