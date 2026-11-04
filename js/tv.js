/**
 * SILLYGER (SG) TV — Live Broadcast Television Station (v2.9.4)
 * Broadcasts synchronized live video streams to all viewers without external video clutter.
 */

let currentPlayingVideoId = "";
let currentPlayingTitle = "";
let isTvMuted = true;
let currentVolume = 100;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Mobile navigation menu toggle
    const menuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
    }

    // 2. Render public session chip
    if (typeof SGUtils !== "undefined" && SGUtils.renderPublicSessionSlot) {
        SGUtils.renderPublicSessionSlot("header-session-slot");
    }

    // 3. Show admin banner if session is admin
    const session = typeof SGStore !== "undefined" ? SGStore.getCurrentSession() : null;
    const adminBanner = document.getElementById("tv-admin-banner");
    if (adminBanner && session && SGStore.isAdminUser(session)) {
        adminBanner.classList.remove("hidden");
    }

    // 4. Initial render from local/cached broadcast state
    renderTvStage(false);

    // 5. Pull the real live broadcast state from Supabase
    await pullTvStateAndRender();

    // 6. Listen for same-tab and cross-tab sync events
    window.addEventListener("sg:synced", (e) => {
        const t = e.detail && e.detail.type;
        if (t === "TV_BROADCAST_UPDATED" || t === "CLOUD_SYNC_COMPLETE") {
            renderTvStage(false);
        }
    });

    if (typeof BroadcastChannel !== "undefined") {
        try {
            const bc = new BroadcastChannel("sg_platform_sync");
            bc.onmessage = (e) => {
                if (e.data && (e.data.type === "TV_BROADCAST_UPDATED" || e.data.type === "CLOUD_SYNC_COMPLETE")) {
                    renderTvStage(false);
                }
            };
        } catch (_) {}
    }

    // 7. Auto-poll Supabase every 15 seconds to switch synchronized viewers live
    setInterval(() => {
        if (document.visibilityState === "hidden") return;
        pullTvStateAndRender();
    }, 15000);
});

async function pullTvStateAndRender() {
    if (typeof SGStore === "undefined" || !SGStore.syncTvState) return;
    try {
        await SGStore.syncTvState();
    } catch (_) {}
    renderTvStage(false);
}

function updateAudioButtonState(muted) {
    const btn = document.getElementById("tv-unmute-btn");
    const icon = document.getElementById("tv-unmute-icon");
    const label = document.getElementById("tv-unmute-label");
    const floatOverlay = document.getElementById("tv-unmute-floating-overlay");
    const slider = document.getElementById("tv-volume-slider");
    const percentEl = document.getElementById("tv-volume-percent");

    if (muted) {
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = "Washa Sauti";
        if (btn) {
            btn.className = "px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30 active:scale-95";
        }
        if (floatOverlay) floatOverlay.classList.remove("hidden");
        if (percentEl) percentEl.textContent = "0%";
    } else {
        if (icon) icon.textContent = "🔇";
        if (label) label.textContent = "Zima Sauti";
        if (btn) {
            btn.className = "px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95";
        }
        if (floatOverlay) floatOverlay.classList.add("hidden");
        if (percentEl) percentEl.textContent = `${currentVolume}%`;
        if (slider) slider.value = currentVolume;
    }
}

function renderTvStage(forceIframeReload = false) {
    const broadcast = typeof SGStore !== "undefined" ? SGStore.getTvBroadcast() : {};
    const playerSlot = document.getElementById("tv-player-slot");
    const statusBadge = document.getElementById("tv-status-badge");
    const indicatorPill = document.getElementById("tv-indicator-pill");
    const stationBadge = document.getElementById("tv-station-badge");
    const titleEl = document.getElementById("tv-current-title");
    const descEl = document.getElementById("tv-current-desc");
    const updatedTimeEl = document.getElementById("tv-updated-time");
    const waBtn = document.getElementById("tv-wa-discuss-btn");
    const floatOverlay = document.getElementById("tv-unmute-floating-overlay");

    const isLive = !!broadcast.is_live;
    const videoUrl = broadcast.url || "";
    const videoId = (typeof SGUtils !== "undefined" && SGUtils.extractYouTubeId(videoUrl)) || broadcast.video_id || "";
    const title = broadcast.title || (isLive ? "SILLYGER Live Broadcast" : "SILLYGER TV");
    const desc = broadcast.desc || "Kituo cha matangazo ya teknolojia na masomo ya pamoja ya jumuiya ya SILLYGER.";

    // 1. Status Badges
    if (statusBadge) {
        if (isLive && videoId) {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase flex items-center gap-2 bg-red-600/20 border border-red-500/50 text-red-400";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span>🔴 ON AIR — LIVE SASA</span>`;
        } else {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>⏸️ STANDBY · MAPUMZIKO</span>`;
        }
    }

    if (indicatorPill) {
        if (isLive && videoId) {
            indicatorPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-red-600 text-white animate-pulse";
            indicatorPill.textContent = "🔴 LIVE BROADCAST";
        } else {
            indicatorPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-slate-800 text-slate-300";
            indicatorPill.textContent = "⏸️ TV STANDBY";
        }
    }

    // 2. Titles & Descriptions
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    try {
        if (updatedTimeEl && broadcast.updated_at) {
            updatedTimeEl.textContent = `Ilisasishwa: ${SGUtils.formatDateSw(broadcast.updated_at, true)}`;
        }
    } catch (_) {}

    // 3. WhatsApp Link
    try {
        if (waBtn) {
            const waLink = typeof SG_CONFIG !== "undefined" ? SG_CONFIG.privateWhatsAppInvite : "";
            if (waLink) {
                waBtn.href = waLink;
                waBtn.target = "_blank";
                waBtn.rel = "noopener noreferrer";
            } else {
                waBtn.href = "member-portal.html";
            }
        }
    } catch (_) {}

    // 4. TV Screen Rendering
    if (playerSlot) {
        if (isLive && videoId) {
            const existingIframe = document.getElementById("sg-tv-iframe");
            const needsReload = forceIframeReload || !existingIframe || currentPlayingVideoId !== videoId;

            if (stationBadge) stationBadge.classList.remove("hidden");

            if (needsReload) {
                currentPlayingVideoId = videoId;
                currentPlayingTitle = title;
                isTvMuted = true;

                // loop=1 & playlist=${videoId} prevents YouTube endscreen grid of other channels' videos!
                // rel=0 prevents outside recommendations
                // iv_load_policy=3 removes annotation clutter
                playerSlot.innerHTML = `
                    <iframe id="sg-tv-iframe"
                            class="w-full h-full border-0"
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&controls=1&iv_load_policy=3&loop=1&playlist=${videoId}"
                            title="${SGUtils.escapeHtml(title)}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen>
                    </iframe>
                `;

                updateAudioButtonState(true);
            }
        } else {
            // Standby Screen (No external videos shown)
            currentPlayingVideoId = "";
            if (stationBadge) stationBadge.classList.add("hidden");
            if (floatOverlay) floatOverlay.classList.add("hidden");

            playerSlot.innerHTML = `
                <div class="text-center p-8 space-y-4 max-w-md">
                    <div class="w-16 h-16 rounded-3xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-blue-500/20 animate-pulse">
                        📺
                    </div>
                    <div class="space-y-1.5">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                            Kituo Kiko Mapumziko
                        </span>
                        <h3 class="text-lg font-bold text-white">SILLYGER TV iko Standby</h3>
                        <p class="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                            Hakuna matangazo yanayorushwa moja kwa moja hewani kwa sasa. Msimamizi atakapoweka somo live, TV itaanza mara moja hapa.
                        </p>
                    </div>
                </div>
            `;
        }
    }
}

// =========================================================================
// TV INTERACTIVE CONTROLS (AUDIO, VOLUME SLIDER, FULLSCREEN, REWIND, REFRESH)
// =========================================================================

window.setTvVolume = function (val) {
    const iframe = document.getElementById("sg-tv-iframe");
    const percentEl = document.getElementById("tv-volume-percent");
    const slider = document.getElementById("tv-volume-slider");
    const num = Math.max(0, Math.min(100, parseInt(val, 10) || 0));

    currentVolume = num;

    if (percentEl) percentEl.textContent = `${num}%`;
    if (slider && slider.value != num) slider.value = num;

    if (iframe && iframe.contentWindow) {
        try {
            if (num > 0 && isTvMuted) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
                isTvMuted = false;
                updateAudioButtonState(false);
            } else if (num === 0 && !isTvMuted) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
                isTvMuted = true;
                updateAudioButtonState(true);
            }
            iframe.contentWindow.postMessage(JSON.stringify({
                event: "command",
                func: "setVolume",
                args: [num]
            }), "*");
        } catch (_) {}
    }
};

window.toggleTvAudio = function () {
    const iframe = document.getElementById("sg-tv-iframe");
    if (!iframe) return;

    if (isTvMuted) {
        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [currentVolume || 100] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
            }
        } catch (_) {}
        isTvMuted = false;
        updateAudioButtonState(false);
        SGUtils.showToast("🔊 Sauti imewashwa!", "success");
    } else {
        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
            }
        } catch (_) {}
        isTvMuted = true;
        updateAudioButtonState(true);
        SGUtils.showToast("🔇 Sauti imezimwa.", "info");
    }
};

window.toggleTvFullscreen = function () {
    const box = document.getElementById("tv-screen-box") || document.getElementById("tv-theater-container");
    if (!box) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (box.requestFullscreen) {
            box.requestFullscreen();
        } else if (box.webkitRequestFullscreen) {
            box.webkitRequestFullscreen();
        } else if (box.msRequestFullscreen) {
            box.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
};

window.restartCurrentTvVideo = function () {
    if (!currentPlayingVideoId) {
        SGUtils.showToast("Hakuna matangazo yanayorushwa hivi sasa.", "warning");
        return;
    }
    const iframe = document.getElementById("sg-tv-iframe");
    if (iframe) {
        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
            }
        } catch (_) {}
        iframe.src = `https://www.youtube.com/embed/${currentPlayingVideoId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&controls=1&iv_load_policy=3&loop=1&playlist=${currentPlayingVideoId}&t=0`;
    }
    isTvMuted = false;
    updateAudioButtonState(false);
    SGUtils.showToast("⏮️ Matangazo yameanza upya kuanzia mwanzo!", "info");
};

window.refreshTvStream = async function () {
    SGUtils.showToast("⏳ Inasasisha matangazo ya SILLYGER TV...", "info");
    if (typeof SGStore !== "undefined" && SGStore.syncTvState) {
        try {
            await SGStore.syncTvState();
        } catch (_) {}
    }
    renderTvStage(true);
    SGUtils.showToast("✓ SILLYGER TV imesasishwa moja kwa moja!", "success");
};

window.copyTvPageLink = function () {
    SGUtils.copyText(window.location.href, "✓ Kiungo cha SILLYGER TV kimenakiliwa!");
};
