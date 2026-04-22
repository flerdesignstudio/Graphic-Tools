import chladniTool from './tools/chladni/chladni-ui.js';

// --- Tool Registry ---
const tools = {
    [chladniTool.id]: chladniTool
    // New tools will be imported and added here
};

let currentTool = null;

document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('tool-sidebar-container');
    const mainContainer = document.getElementById('tool-main-container');
    const navMenu = document.getElementById('app-navigation');

    // Build Navigation UI
    Object.values(tools).forEach(tool => {
        const btn = document.createElement('button');
        btn.className = 'notion-btn notion-btn-secondary nav-btn';
        btn.dataset.toolId = tool.id;
        btn.innerHTML = `<span class="icon">${tool.icon}</span> ${tool.label}`;
        btn.onclick = () => loadTool(tool.id);
        navMenu.appendChild(btn);
    });

    const loadTool = (toolId) => {
        const tool = tools[toolId];
        if (!tool) return;
        if (currentTool === tool) return; // already loaded

        // 1. Teardown active tool
        if (currentTool && currentTool.destroy) {
            currentTool.destroy();
        }

        // Update active state in nav
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.toolId === toolId) {
                btn.style.background = 'var(--text-primary)';
                btn.style.color = '#0d0d0d';
            } else {
                btn.style.background = 'var(--glass-low)';
                btn.style.color = 'var(--text-secondary)';
            }
        });

        // 2. Initialize new tool
        currentTool = tool;
        if (tool.init) {
            tool.init(sidebarContainer, mainContainer);
        }
    };

    // Load initial tool (Chladni)
    loadTool(chladniTool.id);
});
