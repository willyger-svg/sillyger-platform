-- ==============================================================================
-- Migration 017: SILLYGER Live Classroom, Interactive Slide Studio & WebRTC Engine
-- ==============================================================================
-- Enables live teaching studio for Admin with:
-- 1. Synchronized interactive slide decks (zero-bandwidth HD vector presentation)
-- 2. Realtime state broadcast (slides, laser pointer, screen-share mode, voice state)
-- 3. Live student question/chat engine
-- 4. Pre-seeded professional slide decks (Assembly Language Mastery & C Systems)
-- ==============================================================================

-- 1. Slide Decks Table
CREATE TABLE IF NOT EXISTS public.classroom_slide_decks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT DEFAULT '',
    slides JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL DEFAULT 'Super Administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Live Sessions Table
CREATE TABLE IF NOT EXISTS public.classroom_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructor_name TEXT NOT NULL DEFAULT 'Super Administrator',
    status TEXT NOT NULL DEFAULT 'IDLE',
    current_slide_index INT NOT NULL DEFAULT 0,
    presentation_mode TEXT NOT NULL DEFAULT 'SLIDES',
    deck_id TEXT REFERENCES public.classroom_slide_decks(id) ON DELETE SET NULL,
    is_audio_active BOOLEAN NOT NULL DEFAULT false,
    is_screen_sharing BOOLEAN NOT NULL DEFAULT false,
    viewer_count INT NOT NULL DEFAULT 0,
    active_webrtc_channel TEXT DEFAULT 'sg_live_main',
    laser_pointer JSONB DEFAULT '{"active": false, "x": 0.5, "y": 0.5}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Live Classroom Chat & Questions Table
CREATE TABLE IF NOT EXISTS public.classroom_live_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    message TEXT NOT NULL,
    is_question BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classroom_chat_session ON public.classroom_live_chat(session_id, created_at ASC);

-- Row Level Security
ALTER TABLE public.classroom_slide_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_live_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view slide decks" ON public.classroom_slide_decks;
CREATE POLICY "Public can view slide decks" ON public.classroom_slide_decks FOR SELECT TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS "Public can view classroom sessions" ON public.classroom_sessions;
CREATE POLICY "Public can view classroom sessions" ON public.classroom_sessions FOR SELECT TO anon, authenticated, service_role USING (true);

DROP POLICY IF EXISTS "Public can view classroom chat" ON public.classroom_live_chat;
CREATE POLICY "Public can view classroom chat" ON public.classroom_live_chat FOR SELECT TO anon, authenticated, service_role USING (true);

-- Enable Realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_live_chat;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- RPC: Get active classroom state (public for all students)
CREATE OR REPLACE FUNCTION public.sg_classroom_get_state()
RETURNS JSONB AS $$
DECLARE
    v_session public.classroom_sessions%ROWTYPE;
    v_deck public.classroom_slide_decks%ROWTYPE;
    v_chat JSONB;
    v_decks JSONB;
BEGIN
    SELECT * INTO v_session
    FROM public.classroom_sessions
    WHERE status = 'LIVE'
    ORDER BY started_at DESC NULLS LAST, created_at DESC
    LIMIT 1;

    IF v_session.id IS NULL THEN
        SELECT * INTO v_session
        FROM public.classroom_sessions
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF v_session.deck_id IS NOT NULL THEN
        SELECT * INTO v_deck
        FROM public.classroom_slide_decks
        WHERE id = v_session.deck_id
        LIMIT 1;
    END IF;

    IF v_session.id IS NOT NULL THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
        INTO v_chat
        FROM (
            SELECT id, session_id, sender_id, sender_name, role, message, is_question, created_at
            FROM public.classroom_live_chat
            WHERE session_id = v_session.id
            ORDER BY created_at ASC
            LIMIT 60
        ) c;
    ELSE
        v_chat := '[]'::jsonb;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', d.id,
        'title', d.title,
        'subject', d.subject,
        'slide_count', jsonb_array_length(d.slides)
    )), '[]'::jsonb)
    INTO v_decks
    FROM public.classroom_slide_decks d;

    RETURN jsonb_build_object(
        'has_session', (v_session.id IS NOT NULL),
        'session', to_jsonb(v_session),
        'deck', to_jsonb(v_deck),
        'chat', v_chat,
        'available_decks', v_decks
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- RPC: Admin Controls (Live Teaching Studio)
CREATE OR REPLACE FUNCTION public.sg_classroom_admin_control(
    p_session_token TEXT,
    p_action TEXT,
    p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_admin public.members%ROWTYPE;
    v_session_id TEXT;
    v_deck_id TEXT;
    v_title TEXT;
    v_desc TEXT;
    v_slide_idx INT;
    v_mode TEXT;
    v_audio BOOLEAN;
    v_screen BOOLEAN;
    v_pointer JSONB;
BEGIN
    v_admin := public.sg_require_admin(p_session_token);

    IF p_action = 'START_SESSION' THEN
        v_title := COALESCE(p_payload->>'title', 'SILLYGER Live Masterclass');
        v_desc := COALESCE(p_payload->>'description', 'Moja kwa Moja kutoka SILLYGER Tech Studio');
        v_deck_id := p_payload->>'deck_id';
        v_session_id := 'class_' || replace(uuid_generate_v4()::text, '-', '');

        UPDATE public.classroom_sessions
        SET status = 'ENDED', ended_at = NOW()
        WHERE status = 'LIVE';

        INSERT INTO public.classroom_sessions (
            id, title, description, instructor_name, status, current_slide_index,
            presentation_mode, deck_id, is_audio_active, is_screen_sharing, started_at
        ) VALUES (
            v_session_id, v_title, v_desc, v_admin.full_name, 'LIVE', 0,
            'SLIDES', v_deck_id, false, false, NOW()
        );

        RETURN jsonb_build_object('success', true, 'session_id', v_session_id);

    ELSIF p_action = 'END_SESSION' THEN
        v_session_id := p_payload->>'session_id';
        UPDATE public.classroom_sessions
        SET status = 'ENDED', ended_at = NOW(), is_audio_active = false, is_screen_sharing = false
        WHERE (id = v_session_id OR v_session_id IS NULL) AND status = 'LIVE';

        RETURN jsonb_build_object('success', true);

    ELSIF p_action = 'UPDATE_SLIDE' THEN
        v_session_id := p_payload->>'session_id';
        v_slide_idx := COALESCE((p_payload->>'slide_index')::INT, 0);
        v_pointer := p_payload->'laser_pointer';

        UPDATE public.classroom_sessions
        SET current_slide_index = v_slide_idx,
            laser_pointer = COALESCE(v_pointer, laser_pointer),
            updated_at = NOW()
        WHERE id = v_session_id;

        RETURN jsonb_build_object('success', true, 'slide_index', v_slide_idx);

    ELSIF p_action = 'SET_MODE' THEN
        v_session_id := p_payload->>'session_id';
        v_mode := COALESCE(p_payload->>'presentation_mode', 'SLIDES');
        v_screen := COALESCE((p_payload->>'is_screen_sharing')::BOOLEAN, false);

        UPDATE public.classroom_sessions
        SET presentation_mode = v_mode,
            is_screen_sharing = v_screen,
            updated_at = NOW()
        WHERE id = v_session_id;

        RETURN jsonb_build_object('success', true, 'mode', v_mode, 'screen_sharing', v_screen);

    ELSIF p_action = 'SET_AUDIO' THEN
        v_session_id := p_payload->>'session_id';
        v_audio := COALESCE((p_payload->>'is_audio_active')::BOOLEAN, false);

        UPDATE public.classroom_sessions
        SET is_audio_active = v_audio,
            updated_at = NOW()
        WHERE id = v_session_id;

        RETURN jsonb_build_object('success', true, 'audio_active', v_audio);

    ELSIF p_action = 'SWITCH_DECK' THEN
        v_session_id := p_payload->>'session_id';
        v_deck_id := p_payload->>'deck_id';

        UPDATE public.classroom_sessions
        SET deck_id = v_deck_id,
            current_slide_index = 0,
            updated_at = NOW()
        WHERE id = v_session_id;

        RETURN jsonb_build_object('success', true, 'deck_id', v_deck_id);

    ELSIF p_action = 'SAVE_DECK' THEN
        v_deck_id := COALESCE(p_payload->>'id', 'deck_' || replace(uuid_generate_v4()::text, '-', ''));
        INSERT INTO public.classroom_slide_decks (
            id, title, subject, description, slides, created_by, updated_at
        ) VALUES (
            v_deck_id,
            COALESCE(p_payload->>'title', 'Slide Deck Mpya'),
            COALESCE(p_payload->>'subject', 'General'),
            COALESCE(p_payload->>'description', ''),
            COALESCE(p_payload->'slides', '[]'::jsonb),
            v_admin.full_name,
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            subject = EXCLUDED.subject,
            description = EXCLUDED.description,
            slides = EXCLUDED.slides,
            updated_at = NOW();

        RETURN jsonb_build_object('success', true, 'deck_id', v_deck_id);

    ELSE
        RAISE EXCEPTION 'Operesheni haijulikani: %', p_action;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- RPC: Send chat message or student question
CREATE OR REPLACE FUNCTION public.sg_classroom_send_chat(
    p_session_token TEXT,
    p_session_id TEXT,
    p_message TEXT,
    p_is_question BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_member public.members%ROWTYPE;
    v_clean TEXT;
    v_new_id UUID;
    v_role TEXT;
BEGIN
    v_member := public.sg_require_session(p_session_token);

    v_clean := btrim(COALESCE(p_message, ''));
    IF length(v_clean) < 1 THEN
        RAISE EXCEPTION 'Ujumbe hauwezi kuwa mtupu.';
    END IF;
    IF length(v_clean) > 500 THEN
        RAISE EXCEPTION 'Ujumbe ni mrefu mno (kikomo ni herufi 500).';
    END IF;

    IF v_member.role = 'SUPER_ADMIN' OR v_member.role = 'ADMIN' THEN
        v_role := 'INSTRUCTOR';
    ELSE
        v_role := 'STUDENT';
    END IF;

    INSERT INTO public.classroom_live_chat (
        session_id, sender_id, sender_name, role, message, is_question
    ) VALUES (
        p_session_id,
        COALESCE(v_member.member_id, v_member.username),
        v_member.full_name,
        v_role,
        v_clean,
        COALESCE(p_is_question, false)
    ) RETURNING id INTO v_new_id;

    RETURN jsonb_build_object(
        'success', true,
        'chat_id', v_new_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

GRANT EXECUTE ON FUNCTION public.sg_classroom_get_state() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_classroom_admin_control(TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sg_classroom_send_chat(TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- 4. Seed Professional Slide Decks
INSERT INTO public.classroom_slide_decks (id, title, subject, description, slides, created_by)
VALUES
(
    'deck_assembly_mastery',
    'Assembly Language: The Unseen Language of Hackers & Reverse Engineers',
    'Low-Level Architecture & Cybersecurity',
    'Somo la kina la Assembly Language x86-64, CPU Registers, Stack Buffer Overflows na Reverse Engineering kwa kutumia Ghidra.',
    '[{"slide_number": 1, "title": "Slide 1", "category": "ACADEMIC TECHNICAL PRESENTATION", "subtitle": "", "bullet_points": ["Presented by: 2nd Year Computer Science & Cybersecurity Student Focus: Low-Level Architecture \u2022 Exploit Mechanics \u2022 Reverse Engineering"], "code_snippet": "", "code_language": "c", "instructor_notes": "Good morning / afternoon everyone and respected lecturer. Today, I am taking you beneath the glossy surface of modern software. Most programmers live comfortably inside high-level abstractions like Python or Java. But in cybersecurity, the truth lives at the lowest layer of execution: Assembly Language. Today, we will explore why Assembly is not an obsolete relic, but the most lethal and indispensable superpower in cybersecurity."}, {"slide_number": 2, "title": "The High-Level Illusion: What Software Developers Miss", "category": "COMPUTER SCIENCE & CYBERSECURITY", "subtitle": "", "bullet_points": ["THE HIGH-LEVEL WORLD (Python, Java, C#) \u2022 Heavy Abstraction Layer: Completely hides memory addresses, CPU registers, and hardware allocation. \u2022 The Illusion of Safety: Developers assume garbage collectors and runtime checks prevent all disasters. \u2022 Blind to Hardware Reality: When code compiles into an executable binary, high-level names and variables vanish. \u2022 Defenseless at the Boundary: If you cannot read what the compiler produced, you cannot verify if memory is truly secure.", "THE HIGH-LEVEL WORLD (Python, Java, C#)", "THE HARDWARE REALITY (Assembly & CPU) \u2022 Direct 1-to-1 Mapping: Every assembly instruction (MOV, PUSH, CALL, JMP) maps directly to executable CPU machine code. \u2022 Total Memory Authority: You see exact memory offsets, stack frames, heap pointers, and cache behavior without filters. \u2022 Where Vulnerabilities Live: Security flaws (buffer overflows, format strings, race conditions) execute inside memory buffers. \u2022 The Ultimate Defender: Mastering Assembly transforms a programmer from a passive user into a true security analyst.", "THE HARDWARE REALITY (Assembly & CPU)"], "code_snippet": "", "code_language": "c", "instructor_notes": "Consider this: when you write a program in Python or Java, you are standing on top of a massive pyramid of abstractions. You write x = 10, and you have no idea what CPU register handled that value. That abstraction is great for building web apps, but it creates a dangerous blindfold for security. Hackers do not attack high-level syntax; they attack memory boundaries and registers. Assembly shows you software as it actually is."}, {"slide_number": 3, "title": "Anatomy of the Machine: CPU Registers & The Execution Stack", "category": "LOW-LEVEL ARCHITECTURE", "subtitle": "", "bullet_points": ["KEY TAKEAWAY FOR CYBERSECURITY: \u2022 Instruction Pointer (RIP/EIP): The single most critical register. Tells the CPU what byte of memory to run next. Prime target for hackers! \u2022 Stack Pointer (RSP/ESP): Tracks local function variables and nested execution frames in LIFO order. \u2022 Base Pointer (RBP/EBP): Anchors each function''s stack frame. Used to calculate parameter offsets. \u2022 Accumulator (RAX/EAX): Stores mathematical computation results and function return codes.", "KEY TAKEAWAY FOR CYBERSECURITY:"], "code_snippet": "", "code_language": "c", "instructor_notes": "To understand how vulnerabilities work, we must look at CPU Registers. Registers are tiny, ultra-fast memory storage locations built directly inside the processor. Look closely at RIP (the Instruction Pointer) in red. The CPU blindly executes whatever instruction RIP points to. In cybersecurity, our golden rule is: He who controls RIP, controls the entire operating system."}, {"slide_number": 4, "title": "Binary Exploitation: How Assembly Powers Stack Buffer Overflows", "category": "OFFENSIVE SECURITY / EXPLOITATION", "subtitle": "", "bullet_points": ["THE EXPLOITATION LIFECYCLE: \u2022 1. Vulnerable C Code: Functions like strcpy() or gets() fail to validate input length boundaries. \u2022 2. Boundary Breach: Attacker sends input exceeding the allocated 64-byte boundary. \u2022 3. Overwriting Saved RIP: Attacker precisely replaces the saved return pointer with the address of their shellcode. \u2022 4. Shellcode Execution: The CPU jumps directly to injected assembly opcodes, granting instant root terminal access!", "THE EXPLOITATION LIFECYCLE:"], "code_snippet": "", "code_language": "c", "instructor_notes": "Here is where theory turns into a weapon. Look at this diagram of a classic Stack Buffer Overflow. In languages like C, if a programmer uses an unsafe function like strcpy without checking input length, memory spills over. As you see on the right diagram: the attacker fills the buffer with junk characters, stomps over the Base Pointer, and overwrites the Return Address. The CPU then jumps directly to malicious assembly shellcode, granting root admin shell!"}, {"slide_number": 5, "title": "Reverse Engineering & Malware Analysis: Decoding Unknown Threats", "category": "DEFENSIVE SECURITY / INCIDENT RESPONSE", "subtitle": "", "bullet_points": ["WHY DEFENDERS NEED ASSEMBLY: \u2022 Zero Source Code Available: Malware comes only as compiled, obfuscated binaries (.exe, ELF, .dll). \u2022 Industry-Standard Tooling: NSA''s Ghidra, IDA Pro, and Radare2 disassemble bytes into readable Assembly. \u2022 Unmasking Stealth Tricks: Assembly exposes evasion tactics: API hooking, anti-debugging, and dynamic loading. \u2022 Incident Response Triage: Allows engineers to craft YARA detection rules and defeat active ransomware campaigns.", "WHY DEFENDERS NEED ASSEMBLY:"], "code_snippet": "", "code_language": "c", "instructor_notes": "Now let us talk about defense. Imagine a hospital or bank gets hit by ransomware. Malware creators never include their source code. All you have is a compiled binary of raw machine bytes. How does a cybersecurity analyst understand what it does? They open tools like Ghidra (NSA) or IDA Pro. These tools disassemble the binary into Assembly language. By reading ASM, the analyst discovers encryption keys, C2 IP addresses, and neutralizes the threat."}, {"slide_number": 6, "title": "Assembly Language: Honest Analysis of Advantages & Disadvantages", "category": "COMPREHENSIVE EVALUATION", "subtitle": "", "bullet_points": ["DISADVANTAGES (Development Drawbacks) \u2022 Steep Learning Curve: Demands intimate knowledge of CPU hardware, calling conventions, and memory segmentation. \u2022 Zero Hardware Portability: Code written for x86-64 will not run on an ARM processor (e.g., iPhone/M3 Mac). \u2022 Extremely Verbose Syntax: Printing ''Hello World'' takes 30+ lines; commercial web apps in ASM are totally impractical. \u2022 Unforgiving Bug Surface: A single miscalculated register pointer instantly crashes the system kernel.", "DISADVANTAGES (Development Drawbacks)", "ADVANTAGES (Irreplaceable Superpowers) \u2022 Unmatched Execution Speed: Zero runtime overhead, zero virtual machines, zero garbage collection pauses. Maximum throughput. \u2022 Total Memory Authority: Direct access to CPU interrupt flags, model-specific registers, MMU, and cache control. \u2022 Foundational for Binary Security: The only way to craft shellcode, analyze zero-days, and bypass ASLR/DEP via ROP. \u2022 Compiler Verification: You can verify whether a compiler introduced security flaws or timing side-channels.", "ADVANTAGES (Irreplaceable Superpowers)"], "code_snippet": "", "code_language": "c", "instructor_notes": "To be intellectually honest, we must look at both sides of the coin. Why doesn''t everyone code in Assembly? As you see on the left: it has a brutal learning curve, it is not portable between x86 and ARM, and writing big applications is agonizingly slow. However, look at the right column: you get absolute execution speed, total hardware authority, and the unique ability to analyze binary security flaws. This brings us to the ultimate question: which column matters more?"}, {"slide_number": 7, "title": "The Strategic Verdict: Why Advantages Far Outweigh Disadvantages", "category": "THE CRITICAL VERDICT", "subtitle": "", "bullet_points": ["THE REASONING BEHIND THE VERDICT: \u2022 Context Defines Value: For consumer apps, Assembly is inefficient. For hunting Zero-Days and malware, it is 100% indispensable. \u2022 Reading Trumps Writing: Cyber analysts rarely write 50,000 lines of ASM; we READ disassembled binaries to find flaws. \u2022 High-Level Cannot Solve Hardware Bugs: Flaws like Spectre, Meltdown, and Rowhammer cannot be solved through Python. \u2022 Top 1% Career Leverage: While thousands know Python, only an elite few master Assembly\u2014giving you extraordinary job value.", "THE REASONING BEHIND THE VERDICT:"], "code_snippet": "", "code_language": "c", "instructor_notes": "Here is the strategic verdict: Why do the advantages vastly outweigh the disadvantages? Because the disadvantages are merely development inconveniences. You do not use Assembly to build Netflix. In cybersecurity, our primary superpower is the ability to READ and DECODE it. A high-level developer facing compiled malware is completely blind. A specialist who knows Assembly can inspect the stack and neutralize the threat in minutes."}, {"slide_number": 8, "title": "Modern Reality: Assembly in 2026 (x86-64 vs ARM64 & IoT)", "category": "MODERN LANDSCAPE", "subtitle": "", "bullet_points": ["x86-64 ARCHITECTURE Enterprise Servers & Desktops \u2022 CISC architecture with complex, variable-length instructions. \u2022 Core battlefield for Windows Active Directory, Linux cloud servers, and gaming engines. \u2022 Legacy complexity produces abundant ROP gadgets and side-channel attack vectors.", "x86-64 ARCHITECTURE", "ARM64 ARCHITECTURE Mobile & Apple Silicon \u2022 RISC architecture with clean, fixed 32-bit instruction lengths. \u2022 Powers 99% of global smartphones (iOS/Android) and modern Apple M-series chips. \u2022 Hardware defenses like Pointer Authentication (PAC) implemented directly in ASM.", "ARM64 ARCHITECTURE", "IoT & EMBEDDED FIRMWARE Smart Devices & Infrastructure \u2022 MIPS, RISC-V, and ARM embedded processors in routers, vehicles, and smart grids. \u2022 Billions of devices lack OS protections\u2014prime targets for Mirai-style botnets. \u2022 Hardware analysts disassemble raw ROM chips directly using Assembly.", "IoT & EMBEDDED FIRMWARE"], "code_snippet": "", "code_language": "c", "instructor_notes": "Some people assume Assembly is a 1980s technology that died with old mainframe computers. That is completely false. Today, x86-64 dominates enterprise cloud servers. ARM64 powers virtually every smartphone and Apple Silicon computer. And in IoT, billions of smart devices run on embedded RISC-V and MIPS chips. When hackers weaponize smart cameras into botnets, they exploit firmware written in low-level assembly. It is more relevant in 2026 than ever before."}, {"slide_number": 9, "title": "Becoming an Unstoppable Cybersecurity Professional", "category": "CONCLUSION & SUMMARY", "subtitle": "", "bullet_points": ["CORE SUMMARY & TAKEAWAYS \u2022 1. High-Level is for Creation; Low-Level is for Mastery: Anyone can write code, but true security specialists master how code executes on silicon. \u2022 2. Assembly Unlocks Both Red & Blue Teams: Essential for exploit development (Buffer Overflows, ROP) and defensive incident response (Ghidra, Malware Triage). \u2022 3. The Advantages Decisively Crush the Drawbacks: Verbosity doesn''t matter because reading and analyzing low-level binaries provides unrivaled security visibility. \u2022 4. Your Next Step: Explore Ghidra, GDB, and OverTheWire wargames to cultivate your low-level superpower!", "CORE SUMMARY & TAKEAWAYS"], "code_snippet": "", "code_language": "c", "instructor_notes": "To wrap up: As 2nd year Computer Science and Cybersecurity students, our future careers will demand that we solve problems others cannot see. Writing code in Python or JavaScript is wonderful for building apps, but understanding Assembly Language gives you the keys to the kingdom. It is the ultimate low-level superpower of the modern cybersecurity specialist. Thank you very much for your attention. I am now open to any questions!"}]'::jsonb,
    'Super Administrator'
),
(
    'deck_c_systems_architecture',
    'C Systems Architecture: Pointers, Memory Model & Linux Syscalls',
    'Systems Programming & Memory Internals',
    'Uelewa wa ndani wa Virtual Address Space, Stack vs Heap, Pointer Arithmetic na Network Sockets.',
    '[{"slide_number": 1, "title": "C Systems Architecture & Deep Memory Model", "category": "C SYSTEMS PROGRAMMING", "subtitle": "Understanding Virtual Address Space & Hardware Reality", "bullet_points": ["Virtual Memory Architecture: Every user-space process gets a 48-bit virtual address space (on x86-64).", "Text Segment (Code): Read-only memory storing compiled machine instructions.", "Data vs BSS: Initialized global variables (.data) vs Zero-initialized variables (.bss).", "Heap vs Stack Collision Boundary: Heap grows upwards; Stack grows downwards toward each other."], "code_snippet": "#include <stdio.h>\nint global_var = 42;\nint uninit_var;\n\nint main(void) {\n    int stack_var = 10;\n    printf(\"Stack: %p | Data: %p\\n\", (void*)&stack_var, (void*)&global_var);\n    return 0;\n}", "code_language": "c", "instructor_notes": "Emphasize that pointers are not magical abstractions: they are pure 64-bit integer addresses into this memory layout."}, {"slide_number": 2, "title": "The Truth About Pointers & Pointer Arithmetic", "category": "MEMORY & HARDWARE", "subtitle": "How Pointer Arithmetic Scales by sizeof(Type)", "bullet_points": ["A pointer is simply an integer holding a virtual memory address.", "Arithmetic Scaling Rule: (ptr + 1) does NOT add 1 byte! It adds sizeof(*ptr) bytes!", "Void Pointers (void*): Raw memory addresses without type information; must be cast before dereferencing.", "Dereferencing (*ptr): Hardware memory read from the target RAM address."], "code_snippet": "int arr[3] = {10, 20, 30};\nint *p = arr;\n\nprintf(\"p:   %p (value: %d)\\n\", (void*)p, *p);\nprintf(\"p+1: %p (value: %d)\\n\", (void*)(p + 1), *(p + 1));", "code_language": "c", "instructor_notes": "Demonstrate that buffer overflows happen when pointer arithmetic exceeds array boundaries without checks."}, {"slide_number": 3, "title": "Dynamic Memory: Heap Allocation & Memory Leaks", "category": "HEAP MANAGEMENT", "subtitle": "malloc(), free(), brk() and mmap() System Calls", "bullet_points": ["The Heap is managed at user-space by glibc/musl allocators (ptmalloc).", "Under the hood, malloc() invokes the brk() or mmap() syscalls to request pages from the Linux kernel.", "Use-After-Free (UAF): Accessing a pointer after calling free() leads to catastrophic exploitable bugs.", "Double Free: Freeing the same heap chunk twice corrupts glibc chunk metadata (arena chunk poisoning)."], "code_snippet": "char *buf = (char *)malloc(1024);\nif (!buf) { perror(\"malloc failed\"); exit(1); }\nsnprintf(buf, 1024, \"SILLYGER Secure Systems\");\n\nfree(buf);\nbuf = NULL; // Zero pointer immediately after free", "code_language": "c", "instructor_notes": "Explain why setting buf = NULL immediately after free() is an essential security hygiene practice."}, {"slide_number": 4, "title": "System Calls: Direct Kernel Communication", "category": "KERNEL INTERFACE", "subtitle": "Crossing the Ring 3 (User) to Ring 0 (Kernel) Boundary", "bullet_points": ["User processes cannot talk to hardware directly (NIC, disk, screen).", "Syscalls trigger a CPU privilege level switch via the syscall assembly instruction.", "Core Process Syscalls: fork() creates a copy-on-write child process; execve() replaces process memory image.", "File Descriptor Table: 0 (stdin), 1 (stdout), 2 (stderr)."], "code_snippet": "pid_t pid = fork();\nif (pid == 0) {\n    char *args[] = {\"/bin/ls\", \"-la\", NULL};\n    execve(\"/bin/ls\", args, NULL);\n} else if (pid > 0) {\n    wait(NULL);\n}", "code_language": "c", "instructor_notes": "Ask students: What happens if fork() is called inside an infinite loop? (Fork Bomb)."}, {"slide_number": 5, "title": "Network Sockets: Building a Low-Level TCP Server", "category": "NETWORK PROGRAMMING", "subtitle": "Berkeley Sockets API from Scratch in Pure C", "bullet_points": ["Socket Lifecycle: socket() -> bind() -> listen() -> accept() -> read()/write() -> close().", "Endianness: Network Byte Order (Big-Endian) vs Host Byte Order (Little-Endian on x86/ARM).", "Functions htons(), ntohs(), htonl(), ntohl() convert between host and network formats.", "Non-blocking I/O: epoll() and select() for handling 100,000+ simultaneous connections."], "code_snippet": "int server_fd = socket(AF_INET, SOCK_STREAM, 0);\nstruct sockaddr_in addr = {\n    .sin_family = AF_INET,\n    .sin_port = htons(8080),\n    .sin_addr.s_addr = INADDR_ANY\n};\nbind(server_fd, (struct sockaddr*)&addr, sizeof(addr));\nlisten(server_fd, 10);", "code_language": "c", "instructor_notes": "Show how the internet itself is built on top of this exact C sockets API."}]'::jsonb,
    'Super Administrator'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    slides = EXCLUDED.slides,
    updated_at = NOW();

-- 5. Seed default session so students can immediately test
INSERT INTO public.classroom_sessions (
    id, title, description, instructor_name, status, current_slide_index,
    presentation_mode, deck_id, is_audio_active, is_screen_sharing, started_at
) VALUES (
    'session_live_mastery',
    'Darasa la Moja kwa Moja: Assembly & C Low-Level Superpower',
    'Kipindi cha moja kwa moja cha usanifu wa mifumo, kumbukumbu (memory) na binary exploitation.',
    'Super Administrator',
    'LIVE',
    0,
    'SLIDES',
    'deck_assembly_mastery',
    true,
    false,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    status = 'LIVE',
    deck_id = 'deck_assembly_mastery',
    is_audio_active = true,
    updated_at = NOW();

INSERT INTO public.schema_migrations (version, applied_at)
VALUES ('017_live_classroom_studio.sql', NOW())
ON CONFLICT (version) DO NOTHING;
