const fs = require('fs');
const path = require('path');

const canvasPath = path.join(__dirname, 'manafikhi-obsidian', 'tree.canvas');
const htmlTemplatePath = path.join(__dirname, 'tree-template.html');
const outputPath = path.join(__dirname, 'tree.html');

const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf8'));

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>شجرة العائلة - Manafikhi Family Tree</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { color: #333; font-size: 2rem; margin-bottom: 10px; }
    .search-box { text-align: center; margin-bottom: 20px; }
    .search-box input {
      padding: 12px 20px; font-size: 16px;
      border: 2px solid #ddd; border-radius: 25px;
      width: 100%; max-width: 400px; outline: none;
    }
    .search-box input:focus { border-color: #667eea; }
    .tree-container {
      display: flex; flex-direction: column; align-items: center;
      gap: 30px; padding: 20px;
    }
    .tree-node { display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .person-card {
      background: white; border-radius: 12px;
      padding: 15px 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      cursor: pointer; transition: all 0.3s ease;
      min-width: 120px; text-align: center;
    }
    .person-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
    .person-card.color-0 { background: #777; color: white; }
    .person-card.color-1 { background: #bc6798; color: white; }
    .person-card.color-2 { background: #9969b0; color: white; }
    .person-card.color-3 { background: #7c8cd6; color: white; }
    .person-card.color-4 { background: #5b9; color: white; }
    .person-card.color-5 { background: #c95; color: white; }
    .person-card.color-6 { background: #e87925; color: white; }
    .person-card .name { font-weight: bold; font-size: 16px; }
    .person-card .children-count { font-size: 12px; opacity: 0.8; margin-top: 5px; }
    .spouse-row {
      display: flex; gap: 10px; justify-content: center;
      margin-top: 10px; padding-top: 10px;
      border-top: 1px dashed rgba(255,255,255,0.3);
    }
    .children-container {
      display: flex; flex-wrap: wrap; gap: 20px; justify-content: center;
      margin-top: 20px; padding-top: 20px;
      border-top: 2px dashed #ddd; width: 100%; max-width: 1200px;
    }
    .connector { width: 2px; height: 20px; background: #ccc; }
    .hidden { display: none !important; }
    .info-panel {
      position: fixed; top: 20px; right: 20px;
      background: white; padding: 20px; border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      max-width: 300px; display: none; z-index: 100;
    }
    .info-panel.show { display: block; }
    .info-panel h3 { color: #333; margin-bottom: 10px; }
    .info-panel p { color: #666; margin: 5px 0; }
    .info-panel .close-btn {
      position: absolute; top: 10px; right: 10px;
      background: none; border: none; font-size: 20px;
      cursor: pointer; color: #999;
    }
    .loading { text-align: center; padding: 40px; color: #666; }
    .toggle-btn {
      position: absolute; bottom: -10px; left: 50%;
      transform: translateX(-50%); background: #667eea;
      color: white; border: none; border-radius: 50%;
      width: 24px; height: 24px; font-size: 14px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>شجرة العائلة</h1>
    <div class="search-box">
      <input type="text" id="searchInput" placeholder="بحث..." oninput="handleSearch(this.value)">
    </div>
    <p id="memberCount" style="color:#666;margin-top:10px;"></p>
  </div>
  <div class="tree-container" id="treeContainer"><div class="loading">جاري تحميل الشجرة...</div></div>
  <div class="info-panel" id="infoPanel">
    <button class="close-btn" onclick="closeInfo()">&times;</button>
    <h3 id="infoName"></h3>
    <p id="infoGender"></p>
    <p id="infoBirth"></p>
    <p id="infoDeath"></p>
    <p id="infoOccupation"></p>
  </div>
  <script>
    const canvasData = ${JSON.stringify(canvasData)};
    const NODE_COLORS = {
      '0': 'color-0', '1': 'color-1', '2': 'color-2', '3': 'color-3',
      '4': 'color-4', '5': 'color-5', '6': 'color-6'
    };
    let nodeMap = new Map(), edgeMap = new Map(), spouseMap = new Map();
    let spouseTargetMap = new Map(), parentMap = new Map();
    function buildMaps() {
      const textNodes = canvasData.nodes.filter(n => n.type === 'text' || n.type === 'file');
      textNodes.forEach(n => nodeMap.set(n.id, n));
      canvasData.edges.forEach(e => {
        if (e.toEnd !== 'none') {
          const children = edgeMap.get(e.fromNode) || [];
          children.push(e.toNode);
          edgeMap.set(e.fromNode, children);
          parentMap.set(e.toNode, e.fromNode);
        } else {
          const spouses = spouseMap.get(e.fromNode) || [];
          if (!spouses.includes(e.toNode)) spouses.push(e.toNode);
          spouseMap.set(e.fromNode, spouses);
          if (!spouseTargetMap.has(e.toNode)) spouseTargetMap.set(e.toNode, e.fromNode);
        }
      });
    }
    function getNodeName(node) {
      if (!node) return 'Unknown';
      return node.type === 'file' ? (node.file?.split('/').pop()?.replace('.md', '') || 'Unknown') : node.text.split('\\n')[0];
    }
    function getRootNodes() {
      const textNodes = Array.from(nodeMap.values());
      const childIds = new Set(Array.from(edgeMap.values()).flat());
      const spouseTargetIds = new Set(Array.from(spouseTargetMap.keys()));
      return textNodes.filter(n => !childIds.has(n.id) && !spouseTargetIds.has(n.id)).map(n => n.id);
    }
    function renderTree() {
      const container = document.getElementById('treeContainer');
      container.innerHTML = '';
      getRootNodes().forEach(rootId => container.appendChild(renderTreeNode(rootId)));
    }
    function renderTreeNode(nodeId) {
      const node = nodeMap.get(nodeId);
      if (!node) return document.createElement('div');
      const children = edgeMap.get(nodeId) || [];
      const spouses = spouseMap.get(nodeId) || [];
      const colorClass = NODE_COLORS[node.color || '0'];
      const wrapper = document.createElement('div');
      wrapper.className = 'tree-node';
      wrapper.dataset.nodeId = nodeId;
      const mainCard = document.createElement('div');
      mainCard.className = 'person-card ' + colorClass;
      mainCard.onclick = (e) => { e.stopPropagation(); showInfo(node); };
      mainCard.innerHTML = '<div class="name">' + getNodeName(node) + '</div>' + 
        (children.length > 0 ? '<div class="children-count">' + children.length + ' أبناء</div>' : '') +
        (children.length > 0 ? '<button class="toggle-btn" onclick="event.stopPropagation(); toggleChildren(\\'' + nodeId + '\\')">▼</button>' : '');
      wrapper.appendChild(mainCard);
      if (spouses.length > 0) {
        const spouseRow = document.createElement('div');
        spouseRow.className = 'spouse-row';
        spouses.forEach(spouseId => {
          const spouseNode = nodeMap.get(spouseId);
          if (spouseNode) {
            const card = document.createElement('div');
            card.className = 'person-card ' + NODE_COLORS[spouseNode.color || '0'];
            card.onclick = (e) => { e.stopPropagation(); showInfo(spouseNode); };
            card.innerHTML = '<div class="name">' + getNodeName(spouseNode) + '</div>';
            spouseRow.appendChild(card);
          }
        });
        wrapper.appendChild(spouseRow);
      }
      if (children.length > 0) {
        wrapper.appendChild(document.createElement('div')).className = 'connector';
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children-container hidden';
        childrenContainer.id = 'children-' + nodeId;
        children.forEach(childId => childrenContainer.appendChild(renderTreeNode(childId)));
        wrapper.appendChild(childrenContainer);
      }
      return wrapper;
    }
    function toggleChildren(nodeId) {
      const el = document.getElementById('children-' + nodeId);
      if (el) el.classList.toggle('hidden');
    }
    function showInfo(node) {
      document.getElementById('infoName').textContent = getNodeName(node);
      document.getElementById('infoGender').textContent = node.type === 'file' ? 'ملف: ' + node.file : 'type: ' + node.type;
      document.getElementById('infoBirth').textContent = 'الموقع: x=' + node.x + ', y=' + node.y;
      document.getElementById('infoDeath').textContent = 'اللون: ' + (node.color || 'افتراضي');
      document.getElementById('infoOccupation').textContent = 'الحجم: ' + node.width + 'x' + node.height;
      document.getElementById('infoPanel').classList.add('show');
    }
    function closeInfo() { document.getElementById('infoPanel').classList.remove('show'); }
    function handleSearch(query) {
      if (!query.trim()) { renderTree(); return; }
      const q = query.toLowerCase();
      const container = document.getElementById('treeContainer');
      container.innerHTML = '';
      const matching = [];
      nodeMap.forEach((node, id) => {
        if (getNodeName(node).toLowerCase().includes(q)) matching.push(id);
      });
      matching.forEach(id => {
        let current = id;
        while (current && parentMap.get(current)) current = parentMap.get(current);
        if (!container.querySelector('[data-node-id="' + current + '"]')) {
          const div = renderTreeNode(current);
          div.dataset.nodeId = current;
          expandPath(id);
          container.appendChild(div);
        }
      });
      if (!container.children.length) container.innerHTML = '<p style="text-align:center;color:#666;">لا توجد نتائج</p>';
    }
    function expandPath(nodeId) {
      let current = nodeId;
      while (current) {
        const el = document.getElementById('children-' + current);
        if (el) el.classList.remove('hidden');
        current = parentMap.get(current);
      }
    }
    buildMaps();
    renderTree();
    document.getElementById('memberCount').textContent = nodeMap.size + ' عضو';
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, html);
console.log('Created tree.html with embedded data');
