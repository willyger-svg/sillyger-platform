/**
 * SILLYGER (SG) Unified Student Registration Controller (v2.0)
 * Simple, unified student onboarding — no division/institution lock-in.
 */

document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.getElementById("sg-register-form");
    const phoneInput = document.getElementById("reg-phone");
    const phonePreview = document.getElementById("phone-preview");
    const formError = document.getElementById("form-error");
    const regSuccessCard = document.getElementById("reg-success-card");
    const formCard = document.getElementById("reg-form-card");
    const esc = (v) => (typeof SGUtils !== "undefined" ? SGUtils.escapeHtml(v) : String(v || ""));

    // Live Tanzania WhatsApp Phone Auto-Formatter & Preview
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
                phonePreview.textContent = `Format sahihi: +2557XXXXXXXX au 07XXXXXXXX (${normalized})`;
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
            btn.innerHTML = `<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
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
                submitBtn.innerHTML = `<span>Inahifadhi usajili wako...</span>`;
            }

            try {
                await SGStore.syncWithSupabase(true);

                const fullName = document.getElementById("reg-name").value.trim();
                const username = document.getElementById("reg-username").value.trim();
                const email = document.getElementById("reg-email").value.trim();
                const phone = document.getElementById("reg-phone").value.trim();
                const password = document.getElementById("reg-password").value;
                const confirmPassword = document.getElementById("reg-confirm-password").value;
                const motivationEl = document.getElementById("reg-motivation");
                const motivation = motivationEl ? motivationEl.value.trim() : "";

                const agreeConst = document.getElementById("agree-constitution").checked;
                const agreeEthics = document.getElementById("agree-ethics").checked;
                const agreePdpa = document.getElementById("agree-pdpa").checked;

                if (!agreeConst || !agreeEthics || !agreePdpa) {
                    throw new Error("Tafadhali weka alama kwenye kanuni zote tatu za jumuiya ili kuendelea.");
                }

                if (!fullName || fullName.length < 3) {
                    throw new Error("Tafadhali weka jina lako kamili halisi.");
                }

                if (!username || username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
                    throw new Error("Username lazima iwe na herufi au nambari pekee bila nafasi (angalau herufi 3).");
                }

                if (!email || !email.includes("@") || !email.includes(".")) {
                    throw new Error("Tafadhali weka barua pepe (Email) sahihi.");
                }

                const normalizedPhone = SGStore.normalizePhone(phone);
                if (!SGStore.isValidTzPhone(normalizedPhone)) {
                    throw new Error("Namba ya WhatsApp si sahihi kwa Tanzania. Weka muundo wa 07XXXXXXXX au +2557XXXXXXXX.");
                }

                if (password.length < 6) {
                    throw new Error("Nenosiri (Password) lazima liwe na angalau herufi 6.");
                }

                if (password !== confirmPassword) {
                    throw new Error("Manenosiri (Passwords) hayafanani. Hakiki tena.");
                }

                const newApplicant = SGStore.registerApplicant({
                    full_name: fullName,
                    username,
                    email,
                    phone: normalizedPhone,
                    password,
                    track: "SG Student Community",
                    experience: "Student",
                    learning_interest: motivation,
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
        const safeAdminName = esc(adminSession ? adminSession.full_name : "Super Admin");

        if (isAdmin) {
            regSuccessCard.innerHTML = `
                <div class="sg-glass p-8 md:p-10 rounded-3xl border border-indigo-500/40 text-center space-y-6">
                    <div class="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 mx-auto flex items-center justify-center">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>

                    <div>
                        <span class="inline-block px-3 py-1 rounded-full badge-active text-xs font-mono-sg font-bold uppercase mb-3">
                            USAJILI UMEPOKELEWA KWENYE QUEUE
                        </span>
                        <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                            ${safeName} amesajiliwa!
                        </h2>
                        <p class="text-sm text-slate-300 max-w-lg mx-auto">
                            Kikao chako cha utawala (<strong class="text-indigo-300">${safeAdminName}</strong>) kimebaki hai. Unaweza kumwidhinisha sasa hivi kwenye Admin Dashboard.
                        </p>
                    </div>

                    <div class="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2.5">
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">Username:</span>
                            <span class="text-white font-bold">@${safeUsername}</span>
                        </div>
                        <div class="flex justify-between border-b border-slate-800/80 pb-2">
                            <span class="text-slate-500">WhatsApp:</span>
                            <span class="text-blue-400 font-bold">${safePhone}</span>
                        </div>
                        <div class="flex justify-between pt-1">
                            <span class="text-slate-500">Hadhi (Status):</span>
                            <span class="text-amber-400 font-bold">PENDING (Inasubiri Idhini)</span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a href="admin-portal.html" class="w-full sm:w-auto px-7 py-3.5 rounded-2xl btn-sg-primary text-sm flex items-center justify-center gap-2">
                            <span>Fungua Admin Dashboard (Idhinisha)</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                        <button onclick="window.location.reload()" class="px-5 py-3 rounded-2xl border border-slate-700 hover:border-slate-500 text-xs text-slate-300 hover:text-white transition">
                            + Sajili Mwanafunzi Mwingine
                        </button>
                    </div>
                </div>
            `;
            regSuccessCard.scrollIntoView({ behavior: "smooth" });
            return;
        }

        regSuccessCard.innerHTML = `
            <div class="sg-glass p-8 md:p-10 rounded-3xl border border-blue-500/35 text-center space-y-6">
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>

                <div>
                    <span class="inline-block px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold uppercase mb-3">
                        HATUA YA 2 KATI YA 3 · INASUBIRI UTHIBITISHO WA ADMIN
                    </span>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                        Hongera, ${safeName}!
                    </h2>
                    <p class="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                        Akaunti yako ya mwanafunzi ndani ya <strong class="text-blue-400">SILLYGER</strong> imesajiliwa kikamilifu.
                    </p>
                </div>

                <div class="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2.5">
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Username:</span>
                        <span class="text-white font-bold">@${safeUsername}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">WhatsApp:</span>
                        <span class="text-blue-400">${safePhone}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Jumuiya:</span>
                        <span class="text-emerald-400">SG Student Community</span>
                    </div>
                    <div class="flex justify-between pt-1">
                        <span class="text-slate-500">WhatsApp Group:</span>
                        <span class="text-amber-400 font-bold">Itafunguka Ukishaidhinishwa</span>
                    </div>
                </div>

                <div class="p-4 rounded-2xl bg-blue-950/25 border border-blue-500/30 text-slate-200 text-xs text-left max-w-lg mx-auto leading-relaxed">
                    <strong class="text-blue-300 block mb-1">Hatua Inayofuata:</strong>
                    Ingia kwenye <strong>Student Portal</strong> yako sasa hivi. Mara tu Admin atakapoidhinisha ombi lako, utapewa <strong>SG-ID</strong> na kitufe cha kijani cha kuingia kwenye <strong>WhatsApp Group</strong> kitaonekana hapo hapo bila kuhitaji kujisajili upya.
                </div>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="member-portal.html" class="w-full sm:w-auto px-8 py-3.5 rounded-2xl btn-sg-primary text-sm flex items-center justify-center gap-2">
                        <span>Fungua Student Portal Sasa</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                    <a href="index.html" class="text-xs text-slate-400 hover:text-white">Rudi Mwanzo</a>
                </div>
            </div>
        `;
        regSuccessCard.scrollIntoView({ behavior: "smooth" });
    }
});
