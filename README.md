# shop-frontend
빈블러 주문관리 시스템(프론트)
서버 3.35.254.165 gguanggu/Jun0812!

- version
    - node : 20.8.0
    - react : 18.3.1
    - react-query : 4.36.1
    - zustand : 4.3.2

프론트 기동
# 1) 프로젝트로 이동
cd /home/gguanggu/shop-front

# 2) 이전 산출물/캐시 정리(권장)
rm -rf .next
pnpm approve-builds || true
pnpm rebuild -r sharp canvas @parcel/watcher @serialport/bindings-cpp || true

# 3) 프로덕션 빌드 (메모리 여유 주고 빠르게)
FAST_BUILD=1 NODE_OPTIONS=--max-old-space-size=2048 pnpm run build:prod

# 4) PM2로 프로덕션 시작 (cwd 꼭 지정!)
pm2 delete shop-front || true
pm2 start pnpm --name shop-front --cwd /home/gguanggu/shop-front -- run start:prod
pm2 save