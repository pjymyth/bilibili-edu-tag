[![Latest Release](https://img.shields.io/github/v/release/pjymyth/bilibili-edu-tag?style=flat-square)](https://github.com/pjymyth/bilibili-edu-tag/releases/latest)
[![License](https://img.shields.io/github/license/pjymyth/bilibili-edu-tag?style=flat-square)](./LICENSE)


# Bilibili评论学历标签 

> 一个 Edge / Chrome 浏览器扩展：在 B 站（哔哩哔哩）视频评论区，给每位评论用户的头像后随机加一个"最高学历"标签，分布参考中国第七次人口普查数据。

主评论与子回复均会自动注入一个彩色学历标签：

> 🟫 初中 / 🟦 大专 / 🟪 211 / 🌸 985 / 🟧 硕士 / ⬛ 博士 ...

**⚠️ 仅供娱乐。所有标签均为程序基于用户 UID 哈希生成的伪随机结果，与现实身份无关。**

同时集成了一个播放器额外倍速功能。在倍速菜单中加入 3x / 3.5x / 4x / 5x / 10x 等额外选项，支持 `Alt+数字` 快捷切换。




##  学历分布权重

数据依据：[国家统计局第七次全国人口普查公报](http://www.stats.gov.cn/sj/pcsj/rkpc/) 与教育部历年公开数据，结合 B 站用户偏年轻的特点适度调整。

| 标签 | 占比 |
|---|---|
| 小学 | 23.0% |
| 初中 | 32.0% |
| 职高/中专 | 8.0% |
| 高中 | 9.0% |
| 大专 | 11.0% |
| 普通一本 | 10.5% |
| 211 | 3.2% |
| 985 | 2.2% |
| 硕士 | 0.8% |
| 博士 | 0.3% |

### 额外倍速

新增倍速选项：**0.5x / 0.75x / 1x / 1.25x / 1.5x / 2x / 2.5x / 3x / 3.5x / 4x / 5x / 10x**

快捷键：

| 快捷键 | 倍速 |
|---|---|
| `Alt + 1` | 1x |
| `Alt + 2` | 2x |
| `Alt + 3` | 3x |
| `Alt + 4` | 4x |
| `Alt + 5` | 5x |
| `Alt + 6` | 3.5x |
| `Alt + 0` | 10x |

##  安装方法

### 开发者模式手动安装

1. 下载本仓库（Code → Download ZIP，或 `git clone`）或者点击下载[ 最新版本](https://github.com/pjymyth/bilibili-edu-tag/releases/latest)
2. 打开 Edge，地址栏输入 `edge://extensions/`（Chrome 用户用 `chrome://extensions/`）
3. 打开右上角 **"开发人员模式"**
4. 点击 **"加载解压缩的扩展"**，选择本仓库文件夹
5. 打开任意 B 站视频页，滚动到评论区即可




> 暂未上架 Edge Add-ons / Chrome 应用商店，欢迎 PR 协助。

##  技术要点

B 站评论区使用了基于 [Lit](https://lit.dev/) 的 Web Components，DOM 结构是多层嵌套的 Shadow DOM：

```
bili-comments
  └─ bili-comment-thread-renderer (shadow)
       ├─ bili-comment-renderer (shadow)      ← 楼主评论
       │    ├─ bili-avatar
       │    └─ bili-comment-user-info
       └─ bili-comment-replies-renderer (shadow)
            └─ bili-comment-reply-renderer (shadow)  ← 子回复
                 └─ bili-comment-user-info
```

实现关键点：

- **递归穿透 Shadow DOM**：普通 querySelector 拿不到这些组件内部
- **直接读取 lit 组件的 `.data` 属性**：从中拿到 `member.mid` 作为稳定的用户标识
- **Inline 样式注入**：外部 CSS 进不了 shadowRoot，所有样式内联在 badge 元素上
- **基于 UID 的哈希抽样**：同一用户每次刷新看到的标签固定，不会闪烁
- **MutationObserver + 兜底轮询**：覆盖翻页、展开子评论等异步加载场景

##  隐私与安全

-  不收集任何用户信息
-  不发送任何网络请求
-  不读写任何 cookie 或本地存储
-  所有计算均在本地浏览器内完成
-  源码完全开源，可自行审查

##  项目结构

```
bili-edu-tag/
├── manifest.json     # 插件清单（Manifest V3）
├── content.js        # 主逻辑：抽样 + Shadow DOM 注入
├── styles.css        # 标签样式（仅用于 popup）
├── popup.html        # 点击图标的弹窗
├── popup.js          # 弹窗逻辑
└── icons/            # 图标
```

##  开发与贡献

欢迎提 Issue 和 PR！特别欢迎：

- 添加更多学历类型（中专不同分类、海外学历等）
- 适配 B 站动态页、专栏页评论区
- 适配深色模式下的标签样式
- 国际化（其他国家的学历分布）

##  免责声明

本插件为**纯娱乐项目**：

1. 所有学历标签均由程序基于哈希算法生成，**不代表真实信息**
2. 不构成对任何个人的身份评价或学历认证
3. 不要根据本插件的标签做出任何现实判断
4. 使用者应自行承担一切后果

[![Downloads](https://img.shields.io/github/downloads/pjymyth/bilibili-edu-tag/total?style=flat-square)](https://github.com/pjymyth/bilibili-edu-tag/releases)

##  License

MIT License - 详见 [LICENSE](./LICENSE)
