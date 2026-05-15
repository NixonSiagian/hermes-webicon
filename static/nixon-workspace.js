/* =========================================================
   NIXON Workspace - Clean Rebuild
   - Navbar interactions (mobile menu, active state)
   - Agents positioned inside #workspace-map (NOT in .room)
   - Smooth movement between rooms via top/left transitions
   ========================================================= */

(function () {
    'use strict';

    // ---- Room layout (matches CSS percentages exactly) ----
    // Stored as bounding boxes in % so we can place agents *inside*
    // each room without parenting them to the .room element.
    const ROOMS = {
        engineering: { top: 5,  left: 5,   width: 40, height: 40 },
        research:    { top: 5,  left: 55,  width: 40, height: 40 },  // right:5% -> left:55%
        operations:  { top: 55, left: 5,   width: 40, height: 40 },  // bottom:5% -> top:55%
        meeting:     { top: 55, left: 55,  width: 40, height: 40 },
        lounge:      { top: 40, left: 40,  width: 20, height: 20 }
    };

    const ROOM_KEYS = Object.keys(ROOMS);

    // ---- Helpers ----
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    /**
     * Compute a random point (in % of the workspace) inside a given room,
     * keeping a small padding so agents stay clearly within the room walls
     * and don't collide with the room label.
     */
    function pointInRoom(roomName) {
        const r = ROOMS[roomName];
        if (!r) return { top: 50, left: 50 };
        const padX = 4;             // % padding inside room
        const padTop = 8;           // larger padding to avoid label
        const padBottom = 4;

        const minLeft = r.left + padX;
        const maxLeft = r.left + r.width - padX;
        const minTop = r.top + padTop;
        const maxTop = r.top + r.height - padBottom;

        const left = minLeft + Math.random() * (maxLeft - minLeft);
        const top = minTop + Math.random() * (maxTop - minTop);

        // Clamp to viewport bounds (defensive)
        return {
            top: clamp(top, 2, 98),
            left: clamp(left, 2, 98)
        };
    }

    // ---- Navbar interactions ----
    function initNavbar() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                // Close mobile menu after pick
                document.body.classList.remove('menu-open');
            });
        });

        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.body.classList.toggle('menu-open');
            });
        }

        // Close menu on resize back to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.body.classList.remove('menu-open');
            }
        });
    }

    // ---- Agents ----
    function placeAgent(agent) {
        const roomName = agent.dataset.room || 'lounge';
        const pos = pointInRoom(roomName);
        agent.style.top = pos.top + '%';
        agent.style.left = pos.left + '%';
    }

    function initAgents() {
        const agents = document.querySelectorAll('.agent');
        // Initial placement
        agents.forEach(placeAgent);

        // Periodically move some agents around (within their room or to a new room)
        setInterval(() => {
            agents.forEach(agent => {
                // 70% chance to shuffle within the same room, 30% to roam to another room
                const roam = Math.random() < 0.3;
                if (roam) {
                    const next = ROOM_KEYS[Math.floor(Math.random() * ROOM_KEYS.length)];
                    agent.dataset.room = next;
                }
                placeAgent(agent);
            });
        }, 4000);
    }

    // ---- HUD live updates ----
    function initHud() {
        const elTasks = document.getElementById('hud-tasks');
        const elUptime = document.getElementById('hud-uptime');
        if (!elTasks || !elUptime) return;

        setInterval(() => {
            // Drift values slightly so the HUD feels alive
            const tasks = 8 + Math.floor(Math.random() * 12);
            const uptime = (98 + Math.random() * 1.9).toFixed(1) + '%';
            elTasks.textContent = tasks;
            elUptime.textContent = uptime;
        }, 5000);
    }

    // ---- Boot ----
    function boot() {
        initNavbar();
        initAgents();
        initHud();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
