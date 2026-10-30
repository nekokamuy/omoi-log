# OmoiLog：部署至 GitHub Pages

本專案是純靜態網站，網站檔案位於 `dist/`，不需要安裝套件或建置。已提供 `.github/workflows/pages.yml`，推送到 `main` 時將自動發布 `dist/`。

## 1. 建立空白 GitHub 儲存庫

在 https://github.com/new 建立 `omoi-log`。使用 GitHub Free 時選擇 Public。先不要勾選建立 README、.gitignore 或 License，避免與本機內容衝突。

## 2. 第一次推送

在 PowerShell 執行，將 `YOUR_USERNAME` 換成你的 GitHub 使用者名稱：

```powershell
Set-Location 'C:\Data\Yinchen\Projects\Workspace_AI\omoi-log'
git config --global --add safe.directory C:/Data/Yinchen/Projects/Workspace_AI/omoi-log
git add .
git commit -m "Initial OmoiLog app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/omoi-log.git
git push -u origin main
```

此資料夾已有 Git 初始化，目前尚無提交或遠端。`safe.directory` 指令針對此專案處理已偵測到的 Git 擁有者不同問題，不需設定萬用字元。

若 commit 提示缺少姓名與信箱，可先在此專案設定，再重新執行 commit：

```powershell
git config user.name "你的名稱"
git config user.email "你的 GitHub 電子郵件或 noreply 信箱"
```

推送若要求登入，依 Git Credential Manager 的瀏覽器登入提示完成；GitHub 不接受帳號密碼作為 HTTPS Git 密碼。

若已自行設定 origin，先用 `git remote -v` 確認；需要改網址時使用 `git remote set-url origin https://github.com/YOUR_USERNAME/omoi-log.git`，不用重複 add。

## 3. 啟用 Pages

1. 開啟 GitHub 儲存庫 → Settings → Pages。
2. 在 Build and deployment → Source 選擇 GitHub Actions。
3. 開啟 Actions → Deploy OmoiLog to GitHub Pages。
4. 若第一次推送在啟用 Pages 前失敗，選擇 Run workflow → main → Run workflow 重新執行。
5. 部署成功後，網址可從部署紀錄或 Settings → Pages 取得，通常為 `https://YOUR_USERNAME.github.io/omoi-log/`。

`.openai/hosting.json` 是先前 Sites 的設定，GitHub Pages 不讀取它；此流程只發布 `dist/`，不需修改這份檔案，也不需額外設定 GitHub Secret。專案內資源與 PWA 路徑使用相對網址，適用 `/omoi-log/` 子路徑。

## 4. 後續更新

```powershell
npm run check
npm test
git add .
git commit -m "Update OmoiLog"
git push
```

推送後由 Actions 自動更新。只有未提交的檔案才會在下一次 commit 中加入。

## 使用資料

網站原始碼發布至 GitHub；app 中輸入的紀錄與圖片仍保存在使用者瀏覽器，不會自動上傳。從 localhost 換成 GitHub Pages 是不同的網站來源，請先在本機版匯出完整 JSON 備份，再到正式網址還原。

更新時若仍看見舊版，可關閉所有 OmoiLog 分頁後再開啟；避免為更新介面而清除網站資料，這會一併刪除本機紀錄。

官方說明：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
