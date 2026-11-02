/**
 * SILLYGER (SG) Registration Logic & Gate Enforcement (Phase 1)
 */

document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.getElementById("sg-register-form");
    const phoneInput = document.getElementById("reg-phone");
    const phonePreview = document.getElementById("phone-preview");
    const trackSelect = document.getElementById("reg-track");
    const formError = document.getElementById("form-error");
    const regSuccessCard = document.getElementById("reg-success-card");
    const formCard = document.getElementById("reg-form-card");

    // Populate track dropdown from config
    if (trackSelect) {
        trackSelect.innerHTML = `
            <option value="" disabled selected>-- Chagua Kitengo au Mtaala wa Awali --</option>
            <optgroup label="Vitengo 11 vya Utafiti (Article 3)">
                ${SG_CONFIG.DIVISIONS.map(d => `<option value="${d.name}">${d.name} (${d.tagline})</option>`).join('')}
            </optgroup>
            <optgroup label="Ngazi za Mtaala (Article 8)">
                ${SG_CONFIG.CURRICULUM.map(c => `<option value="Level ${c.level}: ${c.title}">Level ${c.level}: ${c.title}</option>`).join('')}
            </optgroup>
        `;

        // Check URL parameters for pre-selected track
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedTrack = urlParams.get("track");
        if (preselectedTrack) {
            for (let option of trackSelect.options) {
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
    window.togglePassword = function(fieldId, btn) {
        const input = document.getElementById(fieldId);
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
        regForm.addEventListener("submit", (e) => {
            e.preventDefault();
            formError.classList.add("hidden");
            formError.textContent = "";

            try {
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

                // Validation
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

                // Register applicant via store
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

                // Set session automatically so applicant can see their portal in PENDING state immediately
                SGStore.setCurrentSession(newApplicant);

                // Display success confirmation card
                displaySuccessScreen(newApplicant);

            } catch (err) {
                formError.textContent = err.message || "Hitilafu imetokea. Jaribu tena.";
                formError.classList.remove("hidden");
                formError.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    }

    function displaySuccessScreen(applicant) {
        if (formCard) formCard.classList.add("hidden");
        if (!regSuccessCard) return;

        regSuccessCard.classList.remove("hidden");
        regSuccessCard.innerHTML = `
            <div class="sg-glass p-8 md:p-12 rounded-3xl border border-cyan-500/40 text-center relative overflow-hidden">
                <div class="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center mb-6">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>

                <div class="inline-block px-3 py-1 rounded-full badge-pending text-xs font-mono-sg font-bold uppercase mb-4">
                    STATUS: PENDING REVIEW (MAOMBI YANAKAGULIWA)
                </div>

                <h2 class="text-2xl md:text-3xl font-extrabold text-white mb-3">
                    Hongera, ${applicant.full_name}!
                </h2>
                
                <p class="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
                    Maombi yako ya kujiunga na <strong class="text-cyan-400">SILLYGER (SG)</strong> yamepokelewa kikamilifu kwenye mfumo rasmi.
                </p>

                <!-- Applicant Summary Box -->
                <div class="max-w-md mx-auto p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono-sg space-y-2 mb-8">
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Username:</span>
                        <span class="text-white font-bold">${applicant.username}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">WhatsApp:</span>
                        <span class="text-cyan-400">${applicant.phone}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-800/80 pb-2">
                        <span class="text-slate-500">Track:</span>
                        <span class="text-slate-300 truncate max-w-[200px]">${applicant.track}</span>
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

                <!-- Guidance notice -->
                <div class="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs text-left max-w-lg mx-auto mb-8">
                    <strong class="font-bold block mb-1">Nini Kinafuata (Appendix A5):</strong>
                    Msimamizi wa Uanachama (Membership Admin) atapitia maombi yako. Mara yakikaguliwa na kuwa <strong>ACTIVE</strong>, utapewa namba yako ya kipekee ya mwanachama (kama <strong>SG-000001</strong>), na kiungo rasmi cha kujiunga na WhatsApp Group kitaonekana moja kwa moja ndani ya <strong>Member Portal Dashboard</strong> yako.
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
