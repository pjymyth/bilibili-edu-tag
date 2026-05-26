/**
 * B站评论学历标签插件 - 主逻辑 v1.1
 *
 * 基于实测的新版评论结构（lit web components + shadow DOM）：
 *   bili-comments
 *     #shadow-root
 *       bili-comment-thread-renderer  (一个评论楼)
 *         #shadow-root
 *           bili-comment-renderer#comment   (楼主评论)
 *             #shadow-root
 *               bili-avatar
 *               bili-comment-user-info     ← 我们在这两者之间插标签
 *               ...
 *           bili-comment-replies-renderer
 *             #shadow-root
 *               bili-comment-reply-renderer (子回复)
 *                 #shadow-root
 *                   bili-comment-user-info ← 子回复没有独立头像，标签插在 user-info 前
 *
 * 用户ID获取：B站这些组件是 lit 实现的，把数据挂在 element.data / element._data / element.__data 上。
 * 我们尝试读取它来拿到 mid（uid）。如果拿不到，退化用 user-info 里的文本。
 */

// ============ 学历分布配置 ============
const EDU_DISTRIBUTION = [
  { id: 'primary',   label: '小学',       weight: 230, color: '#9e9e9e', textColor: '#fff' },
  { id: 'junior',    label: '初中',       weight: 320, color: '#8d6e63', textColor: '#fff' },
  { id: 'vocational',label: '职高/中专', weight: 80,  color: '#a1887f', textColor: '#fff' },
  { id: 'senior',    label: '高中',       weight: 90,  color: '#26a69a', textColor: '#fff' },
  { id: 'college',   label: '大专',       weight: 110, color: '#42a5f5', textColor: '#fff' },
  { id: 'bachelor',  label: '普通一本', weight: 105, color: '#5c6bc0', textColor: '#fff' },
  { id: '211',       label: '211',        weight: 32,  color: '#ab47bc', textColor: '#fff' },
  { id: '985',       label: '985',        weight: 22,  color: '#e91e63', textColor: '#fff' },
  { id: 'master',    label: '硕士',       weight: 8,   color: '#ef6c00', textColor: '#fff' },
  { id: 'phd',       label: '博士',       weight: 3,   color: '#212121', textColor: '#ffd54f' }
];
const TOTAL_WEIGHT = EDU_DISTRIBUTION.reduce((s, e) => s + e.weight, 0);

// ============ 工具函数 ============

function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return Math.abs(h);
}

function pickEducation(userKey) {
  const hash = hashString(userKey);
  let r = hash % TOTAL_WEIGHT;
  for (const item of EDU_DISTRIBUTION) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return EDU_DISTRIBUTION[EDU_DISTRIBUTION.length - 1];
}

/**
 * 从一个 bili-comment-renderer / bili-comment-reply-renderer 节点
 * 尝试拿到用户的稳定标识（mid > name）
 */
function extractUserKey(commentEl) {
  // 1) 直接读 lit 组件的 data 属性（这是最稳的）
  const data = commentEl.data || commentEl._data || commentEl.__data;
  if (data) {
    const member = data.member || data.user || data.author || (data.content && data.content.member);
    if (member) {
      const mid = member.mid || member.uid;
      if (mid) return 'mid:' + mid;
      if (member.uname) return 'name:' + member.uname;
    }
    if (data.mid) return 'mid:' + data.mid;
  }

  // 2) 退化：从 user-info 子组件里找 uid 链接
  const userInfo = commentEl.shadowRoot && commentEl.shadowRoot.querySelector('bili-comment-user-info');
  if (userInfo) {
    // user-info 自己也有 data 属性
    const ud = userInfo.data || userInfo._data;
    if (ud) {
      const m = ud.member || ud.user;
      if (m && (m.mid || m.uid)) return 'mid:' + (m.mid || m.uid);
      if (m && m.uname) return 'name:' + m.uname;
    }
    // 再退化：从 user-info 的 shadowRoot 找 a 标签的 href
    if (userInfo.shadowRoot) {
      const link = userInfo.shadowRoot.querySelector('a[href*="space.bilibili.com"]');
      if (link) {
        const m = link.getAttribute('href').match(/space\.bilibili\.com\/(\d+)/);
        if (m) return 'mid:' + m[1];
      }
      // 用户名文本兜底
      const nameNode = userInfo.shadowRoot.querySelector('#user-name, .user-name, a');
      if (nameNode && nameNode.textContent.trim()) {
        return 'name:' + nameNode.textContent.trim();
      }
    }
  }
  return null;
}

/**
 * 为一个 comment-renderer 节点注入标签
 * insertMode:
 *   'after-avatar' - 插在 bili-avatar 之后（一级评论用）
 *   'before-userinfo' - 插在 bili-comment-user-info 之前（子回复用，因为没单独头像）
 */
function tagOne(commentEl, insertMode) {
  if (!commentEl || !commentEl.shadowRoot) return;
  if (commentEl.dataset.eduTagged === '1') return;

  const userKey = extractUserKey(commentEl);
  if (!userKey) return;

  const sr = commentEl.shadowRoot;

  // 避免重复
  if (sr.querySelector('.edu-tag-badge')) {
    commentEl.dataset.eduTagged = '1';
    return;
  }

  // 找锚点
  let anchor, insertBefore;
  if (insertMode === 'after-avatar') {
    const avatar = sr.querySelector('bili-avatar');
    const userInfo = sr.querySelector('bili-comment-user-info');
    if (!avatar) return;
    anchor = avatar.parentNode;
    insertBefore = userInfo || avatar.nextSibling;
  } else {
    const userInfo = sr.querySelector('bili-comment-user-info');
    if (!userInfo) return;
    anchor = userInfo.parentNode;
    insertBefore = userInfo;
  }
  if (!anchor) return;

  const edu = pickEducation(userKey);
  const badge = document.createElement('span');
  badge.className = 'edu-tag-badge edu-tag-' + edu.id;
  badge.textContent = edu.label;
  // 由于在 Shadow DOM 中，外部 CSS 不会渗透进来，必须把样式写成 inline
  badge.setAttribute('style', [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'margin:0 6px 0 4px',
    'padding:1px 7px',
    'font-size:11px',
    'line-height:16px',
    'height:16px',
    'border-radius:8px',
    'font-weight:600',
    'font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
    'white-space:nowrap',
    'vertical-align:middle',
    'user-select:none',
    'letter-spacing:0.2px',
    'box-shadow:0 1px 2px rgba(0,0,0,0.12)',
    'cursor:help',
    'background:' + edu.color,
    'color:' + edu.textColor,
    'position:relative',
    'z-index:2',
    // 高学历特殊样式
    edu.id === '985'    ? 'background:linear-gradient(135deg,#e91e63,#c2185b);box-shadow:0 0 4px rgba(233,30,99,0.4)' : '',
    edu.id === '211'    ? 'background:linear-gradient(135deg,#ab47bc,#8e24aa)' : '',
    edu.id === 'master' ? 'background:linear-gradient(135deg,#ef6c00,#e65100)' : '',
    edu.id === 'phd'    ? 'background:linear-gradient(135deg,#212121,#424242);color:#ffd54f;border:1px solid #ffd54f;box-shadow:0 0 6px rgba(255,213,79,0.5)' : ''
  ].filter(Boolean).join(';'));
  badge.title = '学历标签（娱乐生成，非真实）: ' + edu.label;

  try {
    if (insertBefore) anchor.insertBefore(badge, insertBefore);
    else anchor.appendChild(badge);
    commentEl.dataset.eduTagged = '1';
  } catch (e) {
    // 个别情况插入失败，忽略
  }
}

/**
 * 主扫描：从顶层 bili-comments 开始往下钻
 */
function scanAll() {
  const biliComments = document.querySelector('bili-comments');
  if (!biliComments || !biliComments.shadowRoot) return;

  // 一级评论：bili-comment-thread-renderer > bili-comment-renderer
  const threads = biliComments.shadowRoot.querySelectorAll('bili-comment-thread-renderer');
  threads.forEach(thread => {
    if (!thread.shadowRoot) return;

    // 楼主评论：插在 user-info 之前（和子回复一致，确保布局正确）
    const main = thread.shadowRoot.querySelector('bili-comment-renderer');
    if (main) tagOne(main, 'before-userinfo');

    // 子回复
    const repliesContainer = thread.shadowRoot.querySelector('bili-comment-replies-renderer');
    if (repliesContainer && repliesContainer.shadowRoot) {
      const replies = repliesContainer.shadowRoot.querySelectorAll('bili-comment-reply-renderer');
      replies.forEach(r => tagOne(r, 'before-userinfo'));
    }
  });
}

// ============ 调度 ============

let scanScheduled = false;
function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    try {
      scanAll();
    } catch (e) {
      console.warn('[B站学历标签] 扫描出错:', e);
    }
  });
}

// 主文档变化（用于初次加载评论组件）
new MutationObserver(scheduleScan).observe(document.documentElement, {
  childList: true,
  subtree: true
});

// 等 bili-comments 出现后，监听它内部的变化（用于翻页/展开子回复时的增量更新）
function attachShadowObserver() {
  const bc = document.querySelector('bili-comments');
  if (bc && bc.shadowRoot && !bc.__eduObserverAttached) {
    new MutationObserver(scheduleScan).observe(bc.shadowRoot, {
      childList: true,
      subtree: true
    });
    bc.__eduObserverAttached = true;
    console.log('[B站学历标签] 已附加 bili-comments shadowRoot 观察者');
  }
}

setInterval(() => {
  attachShadowObserver();
  scheduleScan();
}, 1500);

attachShadowObserver();
scheduleScan();

console.log('[B站学历标签] v1.1.1 加载完成，分布权重总和:', TOTAL_WEIGHT);
