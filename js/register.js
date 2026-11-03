/**
 * SILLYGER (SG) Registration Logic & Gate Enforcement (v1.4)
 */

document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.getElementById("sg-register-form");
    const phoneInput = document.getElementById("reg-phone");
    const phonePreview = document.getElementById("phone-preview");
    const trackSelect = document.getElementById("reg-track");
    const formError = document.getElementById("form-error");
    const regSuccessCard = document.getElementById("reg-success-card");
    const formCard = document.getElementById("reg-form-card");
    const esc = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));

    // Populate track dropdown from config
    if (trackSelect) {
        trackSelect.innerHTML = `
            <option value="" disabled selected>-- Chagua Kitengo au Mtaala wa Awali --</option>
            <optgroup label="Vitengo 11 vya Utafiti (Article 3)">
                ${SG_CONFIG.DIVISIONS.map(d => `<option value="${esc(d.name)}">${esc(d.name)} (${esc(d.tagline)})</option>`).join("")}
            </optgroup>
            <optgroup label="Ngazi za Mtaala (Article 8)">
                ${SG_CONFIG.CURRICULUM.map(c => `<option value="Level ${esc(c.level)}: ${esc(c.title)}">Level ${esc(c.level)}: ${esc(c.title)}</option>`).join("")}
            </optgroup>
        `;

        const urlParams = new URLSearchParams(window.location.search);
        const preselectedTrack = urlParams.get("track");
        if (preselectedTrack) {
            for (const option of trackSelect.options) {
                if (option.value.toLowerCase().includes(preselectedTrack.toLowerCase())) {
                    option.selected = true;
                    break;
                }
            }
        }
    }

    // Phone Auto-Formatter and Preview
    if (phoneInput && phonePreview) {
        phoneInput.addEventListener("input", (e) => {
            const raw = e.target.value;
            if (!raw) {
                phonePreview.textContent = "Format: +255XXXXXXXXX";
                phonePreview.className = "text-[11px] font-mono-sg text-slate-500 mt-1";
                return;
            }
            const normalized = SGStore.normalizePhone(raw);
            const isValid = SGStore.isValidTzPhone(normalized);

            if (isValid) {
                phonePreview.textContent = `✓ Namba itasajiliwa kama: ${normalized}`;
                phonePreview.className = "text-[11px] font-mono-sg text-emerald-400 mt-1";
            } else {
                phonePreview.textContent = `Format sahihi: +2557XXXXXXXX au +2556XXXXXXXX (${normalized})`;
                phonePreview.className = "text-[11px] font-mono-sg text-amber-400 mt-1";
            }
        });
    }

    // Password Toggle Visibility
    window.togglePassword = function (fieldId, btn) {
        const input = document.getElementById(fieldId);
        if (!input) return;
        if (input.type === "password") {
            input.type = "text";
            btn.innerHTML = `<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
        } else {
            input.type = "password";
            btn.innerHTML = `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
        }
    };

    // Form Submission Handler
    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            formError.classList.add("hidden");
            formError.textContent = "";

            const submitBtn = regForm.querySelector('button[type="submit"]');
            const origBtnHtml = submitBtn ? submitBtn.innerHTML : "";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span>Inahifadhi na kusawazisha maombi...</span>`;
            }

            try {
                // Pull latest cloud members if Supabase is connected before checking duplicates
                await SGStore.syncWithSupabase(true);

                const fullName = document.getElementById("reg-name").value.trim();
                const username = document.getElementById("reg-username").value.trim();
                const email = document.getElementById("reg-email").value.trim();
                const phone = document.getElementById("reg-phone").value.trim();
                const password = document.getElementById("reg-password").value;
                const confirmPassword = document.getElementById("reg-confirm-password").value;
                const track = document.getElementById("reg-track").value;
                const experience = document.getElementById("reg-experience").value;
                const motivation = document.getElementById("reg-motivation").value.trim();

                const agreeConst = document.getElementById("agree-constitution").checked;
                const agreeEthics = document.getElementById("agree-ethics").checked;
                const agreePdpa = document.getElementById("agree-pdpa").checked;

                if (!agreeConst || !agreeEthics || !agreePdpa) {
                    throw new Error("Ni lazima ukubali masharti yote matatu (Katiba, Maadili ya Cybersecurity, na Sheria ya PDPA 2022) ili kuendelea.");
                }

                if (!fullName || fullName.length < 3) {
                    throw new Error("Tafadhali weka jina lako kamili halisi.");
                }

                if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
                    throw new Error("Username lazima iwe na herufi/nambari pekee bila nafasi (angalau herufi 3).");
                }

                if (!email || !email.includes("@") || !email.includes(".")) {
                    throw new Error("Tafadhali weka barua pepe (Email) sahihi.");
                }

                const normalizedPhone = SGStore.normalizePhone(phone);
                if (!SGStore.isValidTzPhone(normalizedPhone)) {
                    throw new Error("Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa +2557XXXXXXXX au 07XXXXXXXX.");
                }

                if (password.length < 6) {
                    throw new Error("Nenosiri (Password) lazima liwe na angalau herufi 6.");
                }

                if (password !== confirmPassword) {
                    throw new Error("Manenosiri (Passwords) hayafanani. Hakiki tena.");
                }

                if (!track) {
                    throw new Error("Tafadhali chagua kitengo au mtaala wa kuanzia.");
                }

                const newApplicant = SGStore.registerApplicant({
                    full_name: fullName,
                    username,
                    email,
                    phone: normalizedPhone,
                    password,
                    track,
                    experience,
                    motivation,
                    agreed_constitution: agreeConst,
                    agreed_ethics: agreeEthics,
                    agreed_pdpa: agreePdpa
                });

                await SGStore.flushPendingWrites();

                const currentSession = SGStore.getCurrentSession();
                const isAdmin = SGStore.isAdminUser(currentSession);

                if (!isAdmin) {
                    SGStore.setCurrentSession(newApplicant);
                }

                displaySuccessScreen(newApplicant, isAdmin, currentSession);

            } catch (err) {
                formError.textContent = err.message || "Hitilafu imetokea. Jaribu tena.";
                formError.classList.remove("hidden");
                formError.scrollIntoView({ behavior: "smooth", block: "center" });
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnHtml;
                }
            }
        });
    }

    function displaySuccessScreen(applicant, isAdmin = false, adminSession = null) {
        if (formCard) formCard.classList.add("hidden");
        if (!regSuccessCard) return;

        regSuccessCard.classList.remove("hidden");

        const safeName = esc(applicant.full_name);
        const safeUsername = esc(applicant.username);
        const safePhone = esc(applicant.phone);
        const safeTrack = esc(applicant.track);
        const safeAdminName = esc(adminSession ? adminSession.full_name : "William Gerishom");

        if (isAdmin) {
            regSuccessCard.innerHTML = `
                <div class="sg-glass p-8 md:p-12 rounded-3xl border border-purple-500/50 text-center relative overflow-hidden bg-gradient-to-b from-purple-950/30 to-slate-950">
                    <div class="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center mb-6">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div class="inline-block px-3 py-1 rounded-full badge-active text-xs font-mono-sg font-bold uppercase mb-4">
                        UTAWALA: MAOMBI YAMEHIFADHIWA KWENYE QUEUE
                    </div>

                    <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-3">
                        ${safeName} amesajiliwa!
                    </h2>

                    <p class="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
                        Akaunti mpya imepokelewa kwenye mfumo. Kwa kuwa wewe ni <strong class="text-purple-400">Super Administrator (${safeAdminName})</strong>, kikao chako cha utawala hakijavurugwa.
                    </p>

                    <div class="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2 mb-8">
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">Username:</span>
                            <span class="text-white font-bold">@${safeUsername}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">WhatsApp:</span>
                            <span class="text-cyan-400 font-bold">${safePhone}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">Kitengo (Track):</span>
                            <span class="text-slate-300 truncate max-w-[200px]">${safeTrack}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">Hadhi (Status):</span>
                            <span class="text-amber-400 font-bold">PENDING (Inasubiri Idhini Yako)</span>
                        </div>
                        <div class="flex justify-between pt-1">
                            <span class="text-slate-500">Unique Member ID:</span>
                            <span class="text-slate-500 italic">Itatolewa kiotomatiki ukibonyeza Approve</span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="admin-portal.html" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
                            <span>Fungua Admin Dashboard (Idhinisha Sasa)</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                        <button onclick="window.location.reload()" class="px-6 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-xs text-slate-300 hover:text-white transition">
                            + Sajili Mwanachama Mwingine
                        </button>
                    </div>
                </div>
            `;
            regSuccessCard.scrollIntoView({ behavior: "smooth" });
            return;
        }

        regSuccessCard.innerHTML = `
            <div class="sg-glass p-8 md:p-12 rounded-3xl border border-cyan-500/40 text-center relative overflow-hidden">
                <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center mb-6">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>

                <div class="inline-block px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold uppercase mb-4">
                    STATUS: PENDING REVIEW (MAOMBI YANAKAGULIWA)
                </div>

                <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-3">
                    Hongera, ${safeName}!
                </h2>

                <p class="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
                    Maombi yako ya kujiunga na <strong class="text-cyan-400">SILLYGER (SG)</strong> yamepokelewa kikamilifu kwenye mfumo rasmi.
                </p>

                <div class="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2 mb-8">
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Username:</span>
                        <span class="text-white font-bold">${safeUsername}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">WhatsApp:</span>
                        <span class="text-cyan-400">${safePhone}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Track:</span>
                        <span class="text-slate-300 truncate max-w-[200px]">${safeTrack}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Unique Member ID:</span>
                        <span class="text-amber-400 font-bold">Inasubiri Idhini (SG-xxxxxx)</span>
                    </div>
                    <div class="flex justify-between pt-1">
                        <span class="text-slate-500">WhatsApp Group Link:</span>
                        <span class="text-amber-400 flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Imefungwa (Locked)
                        </span>
                    </div>
                </div>

                <div class="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs text-left max-w-lg mx-auto mb-8">
                    <strong class="font-bold block mb-1">Nini Kinafuata (Appendix A5):</strong>
                    Msimamizi wa Uanachama (Membership Admin) atapitia maombi yako. Mara yakikaguliwa na kuwa <strong>ACTIVE</strong>, utapewa namba yako ya kipekee ya mwanachama (kama <strong>SG-000002</strong>), na kiungo rasmi cha kujiunga na WhatsApp Group kitaonekana moja kwa moja ndani ya <strong>Member Portal Dashboard</strong> yako.
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="member-portal.html" class="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2">
                        <span>Fungua Member Portal Dashboard</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                    <a href="index.html" class="text-xs text-slate-400 hover:text-white">Rudi Mwanzo</a>
                </div>
            </div>
        `;
        regSuccessCard.scrollIntoView({ behavior: "smooth" });
    }
});
