// 订阅文件静态校验: 语法 / 结构 / 两份文件一致性
// 用法: $env:NODE_PATH=(npm root -g); node check.cjs   (依赖全局 json5, 见 CLAUDE.md)
const path = require('path');
let JSON5;
try {
  JSON5 = require('json5');
} catch (e) {
  console.error('FAIL: json5 模块不可解析, 先执行 npm i -g json5 并设置 NODE_PATH: ' + e.message);
  process.exit(2);
}

const root = process.cwd();
const fs = require('fs');
const full = JSON5.parse(fs.readFileSync(path.join(root, '番茄小说去广告.json5'), 'utf8'));
const local = JSON5.parse(fs.readFileSync(path.join(root, '番茄小说-本地订阅粘贴.json5'), 'utf8'));

const problems = [];
const info = [];

// --- 订阅级字段 ---
if (typeof full.version !== 'number') problems.push('完整订阅 version 不是数字');
if (!/^https:\/\/github\.com\//.test(full.supportUri || '')) problems.push('supportUri 不是 GitHub 链接');

// --- 应用与规则组结构 ---
const app = full.apps && full.apps[0];
if (!app || app.id !== 'com.dragon.read') problems.push('完整订阅 apps[0].id 异常');
const fullGroups = (app && app.groups) || [];
const localGroups = local.groups || [];

function checkGroup(g, label) {
  if (typeof g.key !== 'number') problems.push(label + ' key 非数字: ' + g.key);
  if (!g.name) problems.push(label + ' 缺 name');
  if (typeof g.enable !== 'boolean') problems.push(label + ' 缺 enable 或类型错误');
  const keys = new Set();
  (g.rules || []).forEach((r, i) => {
    const tag = label + ' rule#' + i;
    if (!('matches' in r) && !('anyMatches' in r)) problems.push(tag + ' 缺 matches');
    if (r.key !== undefined) {
      if (keys.has(r.key)) problems.push(tag + ' key 重复: ' + r.key);
      keys.add(r.key);
    }
    (r.preKeys || []).forEach((pk) => {
      if (!keys.has(pk)) problems.push(tag + ' preKeys 引用了不存在的 key: ' + pk);
    });
    const urls = [].concat(r.snapshotUrls || []);
    urls.forEach((u) => {
      if (!/^https:\/\/i\.gkd\.li\/(i|import)\/\d+$/.test(u)) problems.push(tag + ' 快照链接格式异常: ' + u);
    });
  });
}

const fullKeys = fullGroups.map((g) => g.key);
if (new Set(fullKeys).size !== fullKeys.length) problems.push('完整订阅规则组 key 有重复');
const localKeys = localGroups.map((g) => g.key);
if (new Set(localKeys).size !== localKeys.length) problems.push('本地订阅规则组 key 有重复');

fullGroups.forEach((g) => checkGroup(g, '完整#key' + g.key));
localGroups.forEach((g) => checkGroup(g, '本地#key' + g.key));

// --- 本地订阅不应包含订阅级字段（本地粘贴格式为单应用对象）---
['version', 'apps', 'supportUri', 'author'].forEach((k) => {
  if (k in local) problems.push('本地订阅不应包含字段: ' + k);
});

// --- 两份文件规则组一致性（深度比较）---
function norm(v) {
  return JSON.parse(JSON.stringify(v));
}
const fg = norm(fullGroups);
const lg = norm(localGroups);
if (JSON.stringify(fg) !== JSON.stringify(lg)) {
  // 定位第一个差异
  let diff = '规则组内容不一致';
  outer: for (let i = 0; i < Math.max(fg.length, lg.length); i++) {
    const a = JSON.stringify(fg[i]);
    const b = JSON.stringify(lg[i]);
    if (a !== b) {
      diff = '规则组 #' + i + ' (key ' + (fg[i] && fg[i].key) + '/' + (lg[i] && lg[i].key) + ') 内容不一致';
      // 细看字段
      const ga = fg[i] || {};
      const gb = lg[i] || {};
      const fields = new Set([...Object.keys(ga), ...Object.keys(gb)]);
      for (const f of fields) {
        if (JSON.stringify(ga[f]) !== JSON.stringify(gb[f])) {
          diff += '; 首个差异字段: ' + f;
          break outer;
        }
      }
      break;
    }
  }
  problems.push(diff);
} else {
  info.push('两份文件的 groups 完全一致 (deep-equal)');
}

// --- 汇总 ---
const enabled = fullGroups.filter((g) => g.enable !== false).length;
info.push('规则组总数=' + fullGroups.length + ', 默认启用=' + enabled + ', 订阅 version=' + full.version);
console.log('INFO:\n  ' + info.join('\n  '));
if (problems.length) {
  console.error('PROBLEMS:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('ALL CHECKS PASSED');
