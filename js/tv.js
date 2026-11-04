/**
 * SILLYGER (SG) TV — Live Stream Player & Video Broadcasting Hub (v2.9.1)
 * Handles embedded YouTube playback, real-time live updates, and archive replay.
 */

let currentPlayingVideoId = "";
let currentPlayingTitle = "";
let isTvMuted = true;

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

    // 4. Initial render from local/cached broadcast state (do not force recreate iframe)
    renderTvStage(false);
    renderTvArchive();

    // 5. Background sync with Cloud (preserves playing iframe if videoId unchanged)
    if (typeof SGStore !== "undefined" && SGStore.syncWithCloud) {
        try {
            await SGStore.syncWithCloud();
            renderTvStage(false);
            renderTvArchive();
        } catch (_) {}
    }

    // 6. Listen for multi-tab broadcast updates
    if (typeof BroadcastChannel !== "undefined") {
        try {
            const bc = new BroadcastChannel("sillyger_sync_v2");
            bc.onmessage = (e) => {
                if (e.data && (e.data.type === "TV_BROADCAST_UPDATED" || e.data.type === "TV_ARCHIVE_UPDATED" || e.data.type === "CLOUD_SYNC_COMPLETE")) {
                    renderTvStage(false);
                    renderTvArchive();
                }
            };
        } catch (_) {}
    }

    // 7. Auto-refresh broadcast state every 25 seconds
    setInterval(async () => {
        if (typeof SGStore !== "undefined" && SGStore.syncWithCloud) {
            try {
                await SGStore.syncWithCloud();
                renderTvStage(false);
            } catch (_) {}
        }
    }, 25000);
});

function updateAudioButtonState(muted) {
    const btn = document.getElementById("tv-unmute-btn");
    const icon = document.getElementById("tv-unmute-icon");
    const label = document.getElementById("tv-unmute-label");
    const floatOverlay = document.getElementById("tv-unmute-floating-overlay");

    if (muted) {
        if (icon) icon.textContent = "🔊";
        if (label) label.textContent = "Washa Sauti";
        if (btn) {
            btn.className = "px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-blue-600/30 active:scale-95";
        }
        if (floatOverlay) floatOverlay.classList.remove("hidden");
    } else {
        if (icon) icon.textContent = "🔇";
        if (label) label.textContent = "Zima Sauti";
        if (btn) {
            btn.className = "px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95";
        }
        if (floatOverlay) floatOverlay.classList.add("hidden");
    }
}

function renderTvStage(forceIframeReload = false) {
    const broadcast = typeof SGStore !== "undefined" ? SGStore.getTvBroadcast() : {};
    const playerSlot = document.getElementById("tv-player-slot");
    const statusBadge = document.getElementById("tv-status-badge");
    const indicatorPill = document.getElementById("tv-indicator-pill");
    const titleEl = document.getElementById("tv-current-title");
    const descEl = document.getElementById("tv-current-desc");
    const updatedTimeEl = document.getElementById("tv-updated-time");
    const waBtn = document.getElementById("tv-wa-discuss-btn");
    const floatOverlay = document.getElementById("tv-unmute-floating-overlay");

    const isLive = !!broadcast.is_live;
    const videoUrl = broadcast.url || "";
    const videoId = (typeof SGUtils !== "undefined" && SGUtils.extractYouTubeId(videoUrl)) || broadcast.video_id || "";
    const title = broadcast.title || (isLive ? "SILLYGER Live Class" : "SILLYGER TV");
    const desc = broadcast.desc || "Kipindi cha teknolojia na mafunzo ya pamoja kutoka SILLYGER Community.";

    // Update Status Badges
    if (statusBadge) {
        if (isLive) {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase flex items-center gap-2 bg-red-600/20 border border-red-500/50 text-red-400";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span>🔴 ON AIR — LIVE SASA</span>`;
        } else {
            statusBadge.className = "px-3 py-1 rounded-full text-xs font-mono-sg font-bold uppercase flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300";
            statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-500"></span><span>⏸️ STANDBY · ON-DEMAND</span>`;
        }
    }

    if (indicatorPill) {
        if (isLive) {
            indicatorPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-red-600 text-white animate-pulse";
            indicatorPill.textContent = "🔴 LIVE BROADCAST";
        } else {
            indicatorPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-blue-950/80 border border-blue-500/40 text-blue-300";
            indicatorPill.textContent = "ON-DEMAND REPLAY";
        }
    }

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (updatedTimeEl && broadcast.updated_at) {
        updatedTimeEl.textContent = `Ilisasishwa: ${SGUtils.formatDateSw(broadcast.updated_at, true)}`;
    }

    // Set WhatsApp link
    if (waBtn) {
        const waLink = typeof SGUtils !== "undefined" ? SGUtils.getWhatsAppGroupInviteUrl() : null;
        if (waLink) {
            waBtn.href = waLink;
            waBtn.target = "_blank";
            waBtn.rel = "noopener noreferrer";
        } else {
            waBtn.href = "member-portal.html";
        }
    }

    // Render Player iframe
    if (playerSlot) {
        if (videoId) {
            const existingIframe = document.getElementById("sg-tv-iframe");
            const needsReload = forceIframeReload || !existingIframe || currentPlayingVideoId !== videoId;

            if (needsReload) {
                currentPlayingVideoId = videoId;
                currentPlayingTitle = title;
                isTvMuted = true; // initial automated page-load starts muted to satisfy modern browser autoplay policies

                playerSlot.innerHTML = `
                    <iframe id="sg-tv-iframe"
                            class="w-full h-full border-0"
                            src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
                            title="${SGUtils.escapeHtml(title)}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen>
                    </iframe>
                `;

                updateAudioButtonState(true);
            }
        } else {
            currentPlayingVideoId = "";
            if (floatOverlay) floatOverlay.classList.add("hidden");
            playerSlot.innerHTML = `
                <div class="text-center p-8 space-y-4 max-w-md">
                    <div class="w-16 h-16 rounded-3xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-blue-500/20">
                        📺
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white">SILLYGER TV iko Standby</h3>
                        <p class="text-xs text-slate-300 leading-relaxed mt-1">
                            Hakuna matangazo ya moja kwa moja ya YouTube yanayoendelea hivi sasa. Chagua somo lolote kwenye orodha hapa chini kuanza kujifunza.
                        </p>
                    </div>
                </div>
            `;
        }
    }
}

function renderTvArchive() {
    const grid = document.getElementById("tv-archive-grid");
    if (!grid) return;

    const archive = typeof SGStore !== "undefined" ? SGStore.getTvArchive() : [];
    if (!archive || archive.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-8 rounded-3xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 font-mono-sg">
                Hakuna video zilizohifadhiwa kwenye maktaba bado.
            </div>
        `;
        return;
    }

    grid.innerHTML = archive.map((item) => {
        const videoId = SGUtils.extractYouTubeId(item.youtube_url || item.video_id);
        const thumb = SGUtils.getYouTubeThumbnail(videoId);
        const safeTitle = SGUtils.escapeHtml(item.title || "SILLYGER Session");
        const safeDesc = SGUtils.escapeHtml(item.description || "Video ya mafunzo");
        const safeCategory = SGUtils.escapeHtml(item.category || "Class");
        const dateStr = SGUtils.formatDateSw(item.created_at || new Date().toISOString());

        return `
            <div class="sg-glass rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer shadow-lg hover:shadow-blue-500/10"
                 onclick="playArchiveVideo('${SGUtils.escapeHtml(item.youtube_url || videoId)}', '${safeTitle}', '${safeDesc}')">
                
                <!-- Video Thumbnail with Play Overlay -->
                <div class="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img src="${thumb}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy">
                    <div class="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                        <div class="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            ▶
                        </div>
                    </div>
                    <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono-sg font-bold bg-slate-950/80 text-blue-300 border border-blue-500/30">
                        ${safeCategory}
                    </span>
                </div>

                <!-- Video Info -->
                <div class="p-4 flex-grow flex flex-col justify-between space-y-2">
                    <div>
                        <h4 class="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                            ${safeTitle}
                        </h4>
                        <p class="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                            ${safeDesc}
                        </p>
                    </div>

                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono-sg text-slate-500">
                        <span>${dateStr}</span>
                        <span class="text-blue-400 font-semibold group-hover:underline flex items-center gap-1">
                            <span>Tazama</span>
                            <span>&rarr;</span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.toggleTvAudio = function () {
    const iframe = document.getElementById("sg-tv-iframe");
    if (!iframe) return;

    if (isTvMuted) {
        // Send postMessage to YouTube player API
        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
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

window.playArchiveVideo = function (urlOrId, title, desc) {
    const videoId = SGUtils.extractYouTubeId(urlOrId);
    if (!videoId) return;

    currentPlayingVideoId = videoId;
    currentPlayingTitle = title;
    isTvMuted = false; // direct user click, so unmuted playback is allowed by browsers

    const playerSlot = document.getElementById("tv-player-slot");
    const titleEl = document.getElementById("tv-current-title");
    const descEl = document.getElementById("tv-current-desc");
    const indicatorPill = document.getElementById("tv-indicator-pill");

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (indicatorPill) {
        indicatorPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono-sg font-bold uppercase bg-blue-950/80 border border-blue-500/40 text-blue-300";
        indicatorPill.textContent = "ON-DEMAND REPLAY";
    }

    if (playerSlot) {
        playerSlot.innerHTML = `
            <iframe id="sg-tv-iframe"
                    class="w-full h-full border-0"
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0&modestbranding=1&enablejsapi=1"
                    title="${SGUtils.escapeHtml(title)}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen>
            </iframe>
        `;
    }

    updateAudioButtonState(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    SGUtils.showToast(`▶ Inacheza: ${title}`, "info");
};

window.restartCurrentTvVideo = function () {
    if (!currentPlayingVideoId) {
        SGUtils.showToast("Hakuna video inayocheza hivi sasa.", "warning");
        return;
    }
    const iframe = document.getElementById("sg-tv-iframe");
    if (iframe) {
        // Send postMessage restart first
        try {
            if (iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
                iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
            }
        } catch (_) {}
        // Also reload src with unmuted autoplay to guarantee instant fresh start
        iframe.src = `https://www.youtube.com/embed/${currentPlayingVideoId}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&t=0`;
    }
    isTvMuted = false;
    updateAudioButtonState(false);
    SGUtils.showToast("⏮️ Video inacheza mwanzo na sauti!", "info");
};

window.refreshTvStream = async function () {
    SGUtils.showToast("⏳ Inasasisha hali ya TV...", "info");
    if (typeof SGStore !== "undefined" && SGStore.syncWithCloud) {
        try {
            await SGStore.syncWithCloud();
        } catch (_) {}
    }
    renderTvStage(true); // force reload iframe on manual click
    renderTvArchive();
    SGUtils.showToast("✓ SILLYGER TV imesasishwa!", "success");
};

window.copyTvPageLink = function () {
    SGUtils.copyText(window.location.href, "✓ Kiungo cha SILLYGER TV kimenakiliwa!");
};
