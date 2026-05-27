/**
 * B站额外倍速选项
 * 在B站播放器的倍速菜单中追加 3x / 3.5x / 4x / 5x / 10x 等额外倍速。
 *
 * 改编自 Tampermonkey 脚本 "Bilibili Extra Speed Options"
 * 作为 Edge/Chrome 扩展内容脚本运行，无需 @grant 等元数据。
 */

(function () {
  'use strict';

  // 你希望出现的倍速列表（可自行加减）
  const TARGET_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 10];

  // 避免重复注入标记
  const INJECT_FLAG = 'data-extra-speed-injected';

  function formatSpeedText(speed) {
    return speed === 1 ? '1.0x' : `${speed}x`;
  }

  function getVideo() {
    return document.querySelector('video');
  }

  function setPlaybackRate(rate) {
    const video = getVideo();
    if (!video) return;
    video.playbackRate = rate;

    // 某些播放器会从 localStorage 读取倍速，顺便写一下（兼容性处理）
    try {
      localStorage.setItem('bpx_player_playback_rate', String(rate));
      localStorage.setItem('biliplayer_playback_rate', String(rate));
    } catch (e) {}
  }

  function highlightCurrentItem(menu) {
    const video = getVideo();
    if (!video) return;
    const r = video.playbackRate;

    const items = menu.querySelectorAll('.bpx-player-ctrl-playbackrate-menu-item');
    items.forEach((item) => {
      const val = parseFloat(item.getAttribute('data-value'));
      if (Math.abs(val - r) < 0.001) {
        item.classList.add('bpx-state-active');
      } else {
        item.classList.remove('bpx-state-active');
      }
    });
  }

  function createMenuItem(speed, menu) {
    const item = document.createElement('div');
    item.className = 'bpx-player-ctrl-playbackrate-menu-item';
    item.setAttribute('data-value', String(speed));
    item.textContent = formatSpeedText(speed);
    item.style.cursor = 'pointer';

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      setPlaybackRate(speed);
      highlightCurrentItem(menu);
    });

    return item;
  }

  function rebuildMenu(menu) {
    // 防止重复处理
    if (menu.getAttribute(INJECT_FLAG) === '1') return;

    // 清空原菜单，用我们自己的列表重建
    menu.innerHTML = '';

    TARGET_SPEEDS.forEach((speed) => {
      menu.appendChild(createMenuItem(speed, menu));
    });

    menu.setAttribute(INJECT_FLAG, '1');
    highlightCurrentItem(menu);
  }

  function findRateMenu() {
    // 新版 bpx 播放器常见 class
    return document.querySelector('.bpx-player-ctrl-playbackrate-menu');
  }

  function installWatcher() {
    // 定时轮询，处理异步加载/切P/换集导致的DOM重建
    setInterval(() => {
      const menu = findRateMenu();
      if (menu) rebuildMenu(menu);

      const video = getVideo();
      if (video && !video.__extraSpeedBound) {
        video.__extraSpeedBound = true;
        video.addEventListener('ratechange', () => {
          const m = findRateMenu();
          if (m) highlightCurrentItem(m);
        });
      }
    }, 800);
  }

  // 快捷键：Alt + 数字快速切倍率
  // 1→1x, 2→2x, 3→3x, 4→4x, 5→5x, 6→3.5x, 0→10x
  function installHotkeys() {
    document.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;

      const map = {
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 3.5,
        '0': 10,
      };
      if (map[e.key] != null) {
        setPlaybackRate(map[e.key]);
        const m = findRateMenu();
        if (m) highlightCurrentItem(m);
      }
    });
  }

  function init() {
    installWatcher();
    installHotkeys();
    console.log('[B站学历标签 / 额外倍速] speed.js 已加载');
  }

  init();
})();
