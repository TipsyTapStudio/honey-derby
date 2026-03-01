# CLAUDE.md — HONEY DERBY

## プロジェクト概要
HONEY DERBY: HTML5 Canvas ベースの野球バッティングゲーム（くまのプーさんのホームランダービー風）。
キャンバスサイズ 480x720px（縦持ちモバイル最適化）。PC キーボード＆モバイルタッチ対応。

## ドキュメント体系

### 開発系
| ファイル | 役割 | 更新タイミング |
|---------|------|--------------|
| `docs/PRD.md` | 企画・要件定義 | 企画フェーズ（変更時は要相談） |
| `CLAUDE.md` | 開発コンテキスト | 開発中に育てる |
| `docs/devlog/YYYY-MM-DD.md` | 開発ログ | 毎セッション終了時 |
| `docs/game-design.md` | ゲーム仕様詳細 | 参照用（変更時は要相談） |

### 広報・コンテンツ系
| ファイル | 役割 | 更新タイミング |
|---------|------|--------------|
| `docs/blog-ideas.md` | 技術ブログのネタ帳・進捗管理 | セッション終了時（devlog から抽出） |
| `docs/blog/` | ブログ記事のドラフト | ネタを膨らませるとき随時 |
| `docs/release-notes.md` | ユーザー向けリリースノート | マイルストーン達成時 |
| `docs/comms/strategy.md` | 広報方針・チャネル・ロードマップ | 方針変更時 |
| `docs/comms/drafts/` | 告知文・SNS投稿の下書き | リリース前 |

## ディレクトリ構成
```
honey-derby/
├── index.html            # エントリポイント (lang="ja")
├── style.css             # Canvas スタイリング（最小限）
├── server.py             # 開発サーバー (Python, port 8089)
├── package.json          # ES modules 宣言のみ ("type": "module")
├── src/                  # ゲームソースコード
│   ├── main.js           # 初期化・アセット読込・イベントリスナー設定
│   ├── game.js           # ゲームループ・ステートマシン（中核）
│   ├── constants.js      # 全定数（141パラメータ）★バランス調整の要
│   ├── renderer.js       # Canvas 2D 描画（全描画ロジック集約）
│   ├── batter.js         # バッター制御・スイングアニメーション
│   ├── pitcher.js        # ピッチャー・投球スポーン
│   ├── ball.js           # 投球中ボールの軌道・物理
│   ├── ballFlight.js     # 打球軌道アニメーション（HR弧・ヒット・ファウル）
│   ├── hitDetector.js    # 打撃判定・スイートスポット・飛距離計算
│   ├── heartbeat.js      # パワーゲージ（72BPM 心拍サイン波）
│   ├── resultDisplay.js  # 結果テキスト表示
│   ├── assetLoader.js    # Promise ベースのアセットプリロード
│   └── audioManager.js   # サウンド管理（SE 13種 + BGM）
├── assets/
│   ├── batter/           # スイングスプライト (swing_01〜11.png)
│   ├── bg/               # 背景画像 (day/night, moai有無)
│   ├── title/            # タイトル画像
│   └── audio/            # SE (13 MP3) + BGM (1 OGG)
├── sim/
│   └── simulate.js       # ヒット判定シミュレーション用ユーティリティ
└── docs/
    ├── PRD.md            # 企画ドキュメント
    ├── game-design.md    # ゲームデザイン詳細仕様
    ├── release-notes.md  # ユーザー向けリリースノート
    ├── blog-ideas.md     # ブログネタ帳・進捗管理
    ├── blog/             # ブログ記事ドラフト
    ├── comms/
    │   ├── strategy.md   # 広報方針・ロードマップ
    │   └── drafts/       # 告知文・SNS投稿の下書き
    └── devlog/           # 開発ログ (日付別)
```

## 技術スタック
- **言語**: Vanilla JavaScript (ES6 modules)
- **描画**: HTML5 Canvas 2D API
- **スタイル**: CSS3（最小限）
- **バンドラー/トランスパイラー**: なし（ブラウザネイティブ ES modules）
- **テストフレームワーク**: なし（`sim/simulate.js` で手動シミュレーション）
- **開発サーバー**: Python (`server.py`, port 8089, no-cache ヘッダー付き)

## 開発サーバーの起動
```bash
python server.py 8089
```
Claude Code の preview 機能では `.claude/launch.json` で `dev` として登録済み。

## コーディング規約

### 命名規則
| 対象 | スタイル | 例 |
|------|---------|-----|
| 変数・関数 | camelCase | `drawBall`, `handleKeyDown` |
| クラス | PascalCase | `Game`, `BallFlight`, `AssetLoader` |
| 定数 | UPPER_SNAKE_CASE | `CANVAS_WIDTH`, `BALL_SPEED` |
| ファイル名 | camelCase | `ballFlight.js`, `hitDetector.js` |
| プライベートメソッド | _camelCase | `_loadImage()`, `_updateFrameIndex()` |

### コードスタイル
- **インデント**: スペース2つ
- **セミコロン**: あり
- **クォート**: シングルクォート優先（テンプレートリテラルは適宜使用）
- **コメント言語**: 日本語OK（ゲーム用語の説明など）
- **import**: `import { X } from './file.js'`（拡張子 `.js` 必須）
- **モジュール構成**: 1ファイル = 1クラス or 1モジュール（単一責任）

## アーキテクチャ

### ゲームループ
```
requestAnimationFrame(loop) → update(dt) → render()
```
- dt は `Math.min(dt, 0.05)` でクランプ（物理暴走防止）

### ステートマシン
```
READY → COUNTDOWN → PITCHING → RESULT → GAME_OVER
                    ↕ (PAUSE: any gameplay state)
```
- 状態遷移は `game.js` の `transitionTo(newState)` で管理
- PAUSE は独立フラグ (`game.paused`)。ゲームループの `update()` をスキップ、`render()` のみ実行
- PAUSE 中は右上「||」ボタン or Escape キーでトグル。RESUME / TITLE ボタン表示

### 設計原則
- **定数の一元管理**: ゲームパラメータはすべて `constants.js` に集約
- **描画の分離**: 描画ロジックはすべて `renderer.js` に集約
- **入力処理**: キーボード・タッチともに `main.js` でリスナー登録、`game.js` で処理

## コアロジックとチューニング

### 投球パースペクティブ (`ball.js`)
ボールはモアイの口 (Y=285) からストライクゾーン (Y=480) へ直線移動するが、
`visualProgress = pow(linearProgress, 2.5)` で遠近感を表現。
- 遠方: ゆっくり小さく → 手前: 急加速して大きくなる
- progress > 1.0（バッター通過後）は微分連続性を保つ線形延長で速度ジャンプを防止
- **注意**: PERSPECTIVE_POWER(2.5) は ball.js 内のローカル定数。変更するとタイミング感が全壊する

### ヒット判定 (`hitDetector.js`)
打撃判定は5段階のパイプラインで処理:

1. **Y判定**: ボールがバット打点 ± `BAT_HITZONE_HEIGHT/2` (±35px) 内にあるか
2. **X判定**: ボールとバット中心の横距離が `BAT_HITZONE_WIDTH/2` (45px) 以内か
3. **飛距離計算**: スイートスポットからの距離で決定（非対称フォールオフ）
4. **方向角計算**: タイミング + コースバイアス + 打点バイアスの3要素合成
5. **判定分類**: FOUL(角度≧40°) → HOME_RUN(≧100m) → HIT(≧30m) → STRIKE

### スイートスポット（非対称設計）
芯はバット先端から `SWEET_SPOT_INSET`(20px) 内側に位置:
- **TIP側 (先端)**: 緩やかなペナルティ (0.2倍率) → 飛ぶ
- **ROOT側 (根元)**: 急なペナルティ (0.6倍率) → 詰まり = 飛ばない
- 芯外は急速フォールオフ → かすり当たりはほぼ飛ばない
- `MAX_DISTANCE`(200m) × スイートスポット倍率 × パワー倍率 = 最終飛距離

### 方向角の3要素合成
打球の方向（左右）は3つの独立した要素を合成:

1. **タイミング方向** (主要素): ボールY位置と打点Yの差分で決定
   - ボールが打点より上 → 早振り → 引っ張り（左）
   - ボールが打点と同じ → ジャスト → センター
   - ボールが打点より下 → 遅振り → 流し打ち（右）
   - `pow(normalized, 0.7)` の増幅カーブで小さなオフセットでも方向が出る
2. **コースバイアス**: 内角→左、外角→右 (`COURSE_DIRECTION_FACTOR = 0.5`)
3. **打点バイアス**: TIP→右（流し）、ROOT→左（引っ張り）(`TIP_DIRECTION_FACTOR = 0.2`)

合成後 ±45° にクランプし、|角度| ≧ 40° でファウル。

### パワーゲージ — 心拍システム (`heartbeat.js`)
サイン波の鼓動でパワー倍率が変動:
- `sin(phase * 2π)` → [0,1]正規化 → `pow(normalized, sharpness)`
- 最終倍率: `MIN_POWER(0.3)` 〜 `1.0`
- **BPM**: 72（安静時心拍）— ステージ制で上げる予定
- **sharpness**: 1（正弦波）— 上げるとピークが鋭くなり HR が出にくくなる
- パワー50%（倍率0.65）でも芯に当てれば HR 圏（100m超）に届く設計

### スイングアニメーション (`batter.js`)
4フェーズのステートマシン:
```
idle (-120°) → impact (120ms, → -360°) → followthrough (100ms, → -480°) → recovery (280ms, → -120°)
```
- ヒット判定ウィンドウ: impact 全体 + followthrough の最初 80ms
- スプライト: 11フレーム (swing_01〜11) をフェーズ進行率にマッピング
- recovery は逆再生 (フレーム 7→0)

### 打球軌道 (`ballFlight.js`)
判定結果に応じて3種類の演出:
- **HOME_RUN**: 2次ベジエ曲線。飛距離に応じて弧の高さ・着地点・飛行時間が変化。160m超は画面外へ消える
- **HIT**: 5フェーズシステム（初期飛翔ベジエ → バウンス3回 → 転がり）。各バウンスは sin 弧で高さ逓減
- **FOUL**: 曲線ベジエ。midX をファウル方向に 65% 偏らせて外側に曲がる演出

### チューニング上の重要な教訓

**`DIRECTION_TIMING_OFFSET_PX` 事件（2026-02-28）**:
高速球への反応遅れ補正のつもりで -5 に設定 → 全打球が左に偏り、流し打ちが死んだ。
→ 0 にリバートして解決。**教訓**: 方向制御パラメータは `sim/simulate.js` で分布を確認してから調整すること。感覚でいじると簡単に壊れる。

**カジュアル向けバランス調整の経緯**:
- `BAT_HITZONE_WIDTH` 90px, `BAT_HITZONE_HEIGHT` 70px — 当たりやすくするため大きめ
- `SWEET_SPOT_RADIUS` 20px — HR を出しやすくするため拡大
- `MAX_DISTANCE` 200m — パワー50%でもHR圏に届くよう設計
- `FOUL_ANGLE_THRESHOLD` 40° — 35°から緩和し流し打ちファウルを減らした
- `TIP_DIRECTION_FACTOR` 0.2 — 0.3 から下げて流し打ちファウルを緩和

### タッチ操作のスムージング (`game.js`)
```javascript
const t = 1 - Math.exp(-TOUCH_SMOOTHING * dt);  // k=8, フレームレート非依存
batter.x += (targetX - batter.x) * t;
```
- 直接位置セットは「軽すぎる」→ 指数スムージングで「重量感」を演出
- `Math.exp(-k*dt)` でフレームレート非依存（60fps でも 30fps でも同じ体感）

### サウンドシステム (`audioManager.js`)
- **SE**: `SOUND_MANIFEST` に 13 効果音を登録。`cloneNode()` で同時再生対応
- **BGM**: `BGM_MANIFEST` に登録。単一 Audio 要素を使い回し
- `playBgm(name, { maxLoops })` — `maxLoops: 1` で1回再生、0 で無限ループ
- `stopBgm()` — 全 BGM 要素を無条件 pause（iOS 対策で defensive に実装）
- **iOS 音声制限**: `unlock()` で `AudioContext.resume()` を呼ぶ。ユーザー操作イベント内で実行必須
- **教訓**: `audio.play()` の Promise 失敗時に状態（`currentBgm`）をリセットしないとリトライがブロックされる
- BGM 素材: しーでんでん（seadenden-8bit.com）— クレジット URL 要（商用 OK）

## 触らないでほしいファイル・注意事項
- **`assets/` 内の画像ファイル** — 外部ツールで作成済み。コードから変更・上書きしない
- **`docs/PRD.md`** — 企画ドキュメント。変更する場合は必ずユーザーに相談
- **`docs/game-design.md`** — ゲーム仕様詳細。参照用。変更時は相談
- **`.claude/`** — Claude Code 設定。手動編集不要
- **`constants.js`** — ゲームバランスに直結。変更する際は変更意図を必ず明示すること。方向系パラメータは `sim/simulate.js` で検証してから変更
- **`ball.js` の `PERSPECTIVE_POWER`** — 投球タイミング感の根幹。`constants.js` にない内部定数だが安易に変更しない
- **ヒット判定の非対称フォールオフ** (`hitDetector.js`) — TIP/ROOT のペナルティ比率 (0.2/0.6) はプレイフィールを左右する。変更時はシミュレーション必須

## デバッグ
- URL に `?debug=1` を付けるとデバッグモード有効
- ゲーム中に `D` キーでデバッグオーバーレイをトグル
- `window._game` でコンソールからゲームオブジェクトにアクセス可能

## セッション終了時のルール
1. `docs/devlog/YYYY-MM-DD.md` を作成 or 更新する
2. 重要な変更（新ファイル追加、アーキテクチャ変更など）があれば `CLAUDE.md` も更新する
3. devlog の内容を振り返り、ブログネタになりそうな話題を `docs/blog-ideas.md` に追記する
   - 技術的に面白い工夫 → `#eng`
   - 見た目・UIの判断 → `#design`
   - ゲームメカニクスの設計判断 → `#gamedesign`
   - AI活用・開発プロセスの知見 → `#ai-dev`
   - 既存ネタと重複しないか確認してから追加
