# The Valley

Society: Sunlit Valley 기반 모드팩 **The Valley – Sunlit Valley Expanded** 서버 전용 런처와 모드 목록이에요.

## 친구용: 설치 방법

1. [Releases](../../releases/latest)에서 **TheValley-Setup.exe**를 받아서 실행해요.
   - 서명되지 않은 프로그램이라 "Windows의 PC 보호" 창이 뜰 수 있어요. **추가 정보 → 실행**을 누르면 돼요.
2. 바탕화면의 **The Valley** 아이콘으로 런처를 켜고 **실행하기**를 눌러요.
3. 처음 한 번은 Java·Prism·모드를 자동으로 설치해서 몇 분 걸려요. 마이크로소프트 로그인 창이 뜨면 마인크래프트를 산 계정으로 로그인해요.
4. 다음부터는 실행하기 한 번이면 업데이트 확인 → 게임 실행 → 서버 접속까지 자동이에요.

> 자동 다운로드가 막힌 모드가 있으면 런처가 목록을 띄워요. 각 페이지에서 Download만 누르면 런처가 다운로드 폴더에서 찾아서 넣어줘요.

## 관리자용

| 파일 | 하는 일 |
|---|---|
| `launcher-config.json` | 서버 주소, 공지사항, 메모리. **여기만 고치면 모든 친구 런처에 바로 반영** |
| `pack/` | packwiz 모드 목록 (런처가 실행할 때마다 이걸 기준으로 업데이트) |
| `pack/manual-mods.json` | CurseForge 자동 다운로드가 막혀서 직접 받아야 하는 모드 |
| `launcher/` | 런처 소스 (Electron) |

- **모드팩 새 버전 적용**: Actions → "팩 가져오기" → Run workflow (zip 주소만 바꿔서 실행)
- **런처 새로 빌드**: `launcher/`를 고쳐서 push하면 자동으로 빌드돼서 Releases에 올라가요.
- **서버 주소 바꾸기**: `launcher-config.json`의 `server.host` / `server.port`

런처는 내부적으로 [Prism Launcher](https://prismlauncher.org) (GPL-3.0)와 [packwiz](https://packwiz.infra.link)를 내려받아 사용해요.
