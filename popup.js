const EDU = [
  { label: '小学',       weight: 230, color: '#9e9e9e' },
  { label: '初中',       weight: 320, color: '#8d6e63' },
  { label: '职高/中专', weight: 80,  color: '#a1887f' },
  { label: '高中',       weight: 90,  color: '#26a69a' },
  { label: '大专',       weight: 110, color: '#42a5f5' },
  { label: '普通一本',  weight: 105, color: '#5c6bc0' },
  { label: '211',        weight: 32,  color: '#ab47bc' },
  { label: '985',        weight: 22,  color: '#e91e63' },
  { label: '硕士',       weight: 8,   color: '#ef6c00' },
  { label: '博士',       weight: 3,   color: '#212121', textColor: '#ffd54f' }
];
const TOTAL = EDU.reduce((s, e) => s + e.weight, 0);

const list = document.getElementById('list');
EDU.forEach(e => {
  const row = document.createElement('div');
  row.className = 'row';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = e.label;
  tag.style.background = e.color;
  if (e.textColor) tag.style.color = e.textColor;
  const pct = document.createElement('span');
  pct.className = 'pct';
  pct.textContent = (e.weight / TOTAL * 100).toFixed(1) + '%';
  row.appendChild(tag);
  row.appendChild(pct);
  list.appendChild(row);
});
