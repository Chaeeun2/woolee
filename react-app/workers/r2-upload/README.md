# WOO LEE R2 Upload Worker

Cloudflare R2에 이미지와 영상을 업로드하고, 프론트엔드에 공개 URL과 R2 object key를 돌려주는 Worker입니다.

## 준비

1. Cloudflare Dashboard에서 R2 bucket을 만듭니다.
2. `wrangler.toml`의 `bucket_name`을 실제 bucket 이름으로 바꿉니다.
3. `PUBLIC_R2_BASE_URL`을 R2 public bucket URL 또는 커스텀 도메인으로 바꿉니다.
4. `ALLOWED_ORIGIN`을 개발 중에는 `http://localhost:5173`, 배포 후에는 Firebase Hosting 도메인으로 설정합니다.

## 실행

```sh
npm install
npm run dev
```

## 배포

```sh
npx wrangler login
npm run deploy
```

배포 후 React 앱의 `.env`에 Worker URL을 추가합니다.

```env
VITE_R2_WORKER_URL=https://woolee-r2-upload.<your-subdomain>.workers.dev
```

선택적으로 Worker secret을 설정하면 업로드/삭제 요청에 `Authorization: Bearer <token>`이 필요합니다.

```sh
npx wrangler secret put UPLOAD_TOKEN
```
