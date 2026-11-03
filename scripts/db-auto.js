#!/usr/bin/env node
/**
 * SILLYGER (SG) Automated Cloud Database Engine & Schema Migrator
 * -------------------------------------------------------------------------
 * Enables 100% automated PostgreSQL table creation, column additions/removals,
 * schema migrations, and project provisioning directly from code (NO manual
 * SQL Editor copy-pasting needed!).
 *
 * Supported Credentials (checked automatically in order):
 *   1. Supabase Personal Access Token (sbp_...):
 *      - /home/willyger/Desktop/supabase_token.txt
 *      - env SUPABASE_ACCESS_TOKEN
 *   2. Direct PostgreSQL Connection String (postgresql://...):
 *      - /home/willyger/Desktop/database_url.txt
 *      - env DATABASE_URL (uses /usr/bin/psql)
 *
 * Commands:
 *   node scripts/db-auto.js status           # Check token, project & live tables
 *   node scripts/db-auto.js bootstrap        # Auto-create/find project, wire js/config.js & migrate
 *   node scripts/db-auto.js migrate          # Apply schema.sql + pending migrations/*.sql
 *   node scripts/db-auto.js sql "<SQL>"      # Run any CREATE/ALTER/DROP/SELECT SQL directly
 *   node scripts/db-auto.js file <path.sql>  # Execute a specific SQL file
 *   node scripts/db-auto.js tables           # List all live tables & columns in cloud DB
 *   node scripts/db-auto.js new <slug>       # Scaffold next numbered migration in migrations/
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DESKTOP_TOKEN_FILE = "/home/willyger/Desktop/supabase_token.txt";
const DESKTOP_DB_URL_FILE = "/home/willyger/Desktop/database_url.txt";
const PROJECT_META_FILE = path.join(ROOT_DIR, ".supabase-project.json");
const SCHEMA_FILE = path.join(ROOT_DIR, "schema.sql");
const MIGRATIONS_DIR = path.join(ROOT_DIR, "migrations");
const CONFIG_JS_FILE = path.join(ROOT_DIR, "js", "config.js");

const SUPABASE_API = "https://api.supabase.com/v1";

function readCleanFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, "utf8").trim();
        }
    } catch (_) {}
    return "";
}

function getSupabaseAccessToken() {
    if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
    return readCleanFile(DESKTOP_TOKEN_FILE);
}

function getDatabaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
    return readCleanFile(DESKTOP_DB_URL_FILE);
}

function loadProjectMeta() {
    try {
        if (fs.existsSync(PROJECT_META_FILE)) {
            return JSON.parse(fs.readFileSync(PROJECT_META_FILE, "utf8"));
        }
    } catch (_) {}
    return {};
}

function saveProjectMeta(meta) {
    const existing = loadProjectMeta();
    const merged = { ...existing, ...meta, updated_at: new Date().toISOString() };
    fs.writeFileSync(PROJECT_META_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });
    return merged;
}

function inferProjectRefFromConfig() {
    const meta = loadProjectMeta();
    if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF.trim();
    if (meta.project_ref) return meta.project_ref;

    const cfg = readCleanFile(CONFIG_JS_FILE);
    const m = cfg.match(/https:\/\/([a-z0-9]{15,30})\.supabase\.co/);
    return m ? m[1] : "";
}

async function mgmtRequest(method, endpoint, body = null) {
    const token = getSupabaseAccessToken();
    if (!token) {
        throw new Error(
            "Supabase Access Token haijapatikana! Weka token (sbp_...) kwenye /home/willyger/Desktop/supabase_token.txt au SUPABASE_ACCESS_TOKEN."
        );
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
    };
    const opts = { method, headers };
    if (body !== null) {
        headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
    }

    const res = await fetch(`${SUPABASE_API}${endpoint}`, opts);
    const text = await res.text();
    let parsed = null;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch (_) {
        parsed = text;
    }

    if (!res.ok) {
        const detail = typeof parsed === "object" && parsed !== null
            ? (parsed.message || parsed.error || JSON.stringify(parsed))
            : String(parsed);
        throw new Error(`Supabase API ${method} ${endpoint} failed (${res.status}): ${detail}`);
    }
    return parsed;
}

/**
 * Execute raw SQL automatically via either:
 *  - Supabase Management API (/v1/projects/{ref}/database/query), OR
 *  - Direct PostgreSQL (/usr/bin/psql with DATABASE_URL)
 */
async function executeSql(sqlQuery) {
    const token = getSupabaseAccessToken();
    const projectRef = inferProjectRefFromConfig();

    if (token && projectRef) {
        return await mgmtRequest("POST", `/projects/${projectRef}/database/query`, {
            query: sqlQuery
        });
    }

    const dbUrl = getDatabaseUrl();
    if (dbUrl) {
        const out = execFileSync(
            "psql",
            [dbUrl, "-X", "-v", "ON_ERROR_STOP=1", "-P", "pager=off", "-c", sqlQuery],
            { encoding: "utf8" }
        );
        return out;
    }

    throw new Error(
        "Hakuna muunganisho wa Database bado! Weka Supabase Token (sbp_...) kwenye /home/willyger/Desktop/supabase_token.txt kisha endesha: node scripts/db-auto.js bootstrap"
    );
}

/**
 * Update DEFAULT_SUPABASE_URL & DEFAULT_SUPABASE_ANON_KEY inside js/config.js automatically
 */
function injectCredentialsIntoConfigJs(projectUrl, anonKey) {
    let content = fs.readFileSync(CONFIG_JS_FILE, "utf8");
    content = content.replace(
        /const DEFAULT_SUPABASE_URL = "[^"]*";/,
        `const DEFAULT_SUPABASE_URL = "${projectUrl}";`
    );
    content = content.replace(
        /const DEFAULT_SUPABASE_ANON_KEY = "[^"]*";/,
        `const DEFAULT_SUPABASE_ANON_KEY = "${anonKey}";`
    );
    fs.writeFileSync(CONFIG_JS_FILE, content, "utf8");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Bootstrap:
 *  1. Find existing `sillyger-platform` project (or create one automatically!)
 *  2. Wait until project status is ACTIVE_HEALTHY
 *  3. Fetch anon public key and inject into js/config.js
 *  4. Run schema.sql + all migrations/*.sql
 */
async function cmdBootstrap() {
    console.log("🚀 Inaanza usanidi wa kiotomatiki wa Supabase Cloud Database...");

    const projects = await mgmtRequest("GET", "/projects");
    let target = Array.isArray(projects)
        ? projects.find(p => p.name && p.name.toLowerCase().includes("sillyger")) || projects[0]
        : null;

    if (!target) {
        console.log("📦 Hakuna mradi wa SILLYGER uliopatikana bado — inaunda mradi mpya wa bure (sillyger-platform)...");
        const orgs = await mgmtRequest("GET", "/organizations");
        if (!Array.isArray(orgs) || orgs.length === 0) {
            throw new Error("Akaunti yako ya Supabase haina Organization bado. Ingia mara moja supabase.com kukamilisha akaunti.");
        }
        const org = orgs[0];
        const dbPass = "SG_Db#" + crypto.randomBytes(12).toString("hex") + "A1!";
        target = await mgmtRequest("POST", "/projects", {
            name: "sillyger-platform",
            organization_id: org.id,
            organization_slug: org.slug || org.id,
            region: "eu-central-1",
            db_pass: dbPass,
            plan: "free"
        });
        saveProjectMeta({
            project_ref: target.id,
            organization_id: org.id,
            region: target.region || "eu-central-1",
            db_pass: dbPass
        });
        console.log(`✓ Mradi umeundwa: ${target.name} (ref: ${target.id})`);
    } else {
        saveProjectMeta({
            project_ref: target.id,
            organization_id: target.organization_id,
            region: target.region
        });
        console.log(`✓ Mradi uliopo umepatikana: ${target.name} (ref: ${target.id}, status: ${target.status})`);
    }

    const ref = target.id;

    // Wait for database to be ACTIVE_HEALTHY if newly created
    for (let attempt = 1; attempt <= 30; attempt++) {
        const info = await mgmtRequest("GET", `/projects/${ref}`);
        if (info && info.status === "ACTIVE_HEALTHY") {
            console.log("✓ Database iko tayari (ACTIVE_HEALTHY)!");
            break;
        }
        console.log(`⏳ Inasubiri PostgreSQL iwake (${attempt}/30 — hali: ${info ? info.status : "initializing"})...`);
        await sleep(5000);
    }

    // Fetch API keys
    const keysRes = await mgmtRequest("GET", `/projects/${ref}/api-keys?reveal=true`);
    const keysList = Array.isArray(keysRes) ? keysRes : (keysRes && Array.isArray(keysRes.api_keys) ? keysRes.api_keys : []);
    const anonEntry = keysList.find(k => k.name === "anon" || k.type === "publishable");
    if (!anonEntry || !anonEntry.api_key) {
        throw new Error("Imeshindikana kusoma Anon Public Key kutoka Supabase API.");
    }

    const projectUrl = `https://${ref}.supabase.co`;
    injectCredentialsIntoConfigJs(projectUrl, anonEntry.api_key);
    saveProjectMeta({ project_ref: ref, project_url: projectUrl });
    console.log(`✓ js/config.js imesasishwa kiotomatiki na URL: ${projectUrl}`);

    // Run base schema & migrations
    await cmdMigrate();
    console.log("🎉 Imekamilika 100%! Database, majedwali yote na js/config.js viko tayari!");
}

/**
 * Migrate: Apply schema.sql + all unapplied SQL files in migrations/
 */
async function cmdMigrate() {
    console.log("🔄 Inakagua na kusasisha majedwali ya PostgreSQL...");

    // 1. Ensure schema_migrations tracking table exists
    await executeSql(`
        CREATE TABLE IF NOT EXISTS public.schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    // 2. Always ensure base idempotent schema.sql is up-to-date
    if (fs.existsSync(SCHEMA_FILE)) {
        const baseSql = fs.readFileSync(SCHEMA_FILE, "utf8");
        await executeSql(baseSql);
        console.log("✓ Base schema.sql imesawazishwa kikamilifu.");
    }

    // 3. Apply numbered migrations in migrations/*.sql
    if (fs.existsSync(MIGRATIONS_DIR)) {
        const appliedRes = await executeSql(`SELECT version FROM public.schema_migrations ORDER BY version ASC;`);
        const appliedSet = new Set();
        if (Array.isArray(appliedRes)) {
            appliedRes.forEach(r => { if (r && r.version) appliedSet.add(r.version); });
        } else if (typeof appliedRes === "string") {
            appliedRes.split("\n").map(s => s.trim()).filter(Boolean).forEach(v => appliedSet.add(v));
        }

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith(".sql"))
            .sort();

        for (const file of files) {
            if (appliedSet.has(file)) {
                console.log(`  ↷ Tayari ilishawekwa: ${file}`);
                continue;
            }
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
            console.log(`  ⚡ Inaweka migration mpya: ${file}...`);
            await executeSql(sql);
            const safeVer = file.replace(/'/g, "''");
            await executeSql(`INSERT INTO public.schema_migrations (version) VALUES ('${safeVer}') ON CONFLICT (version) DO NOTHING;`);
            console.log(`  ✓ Imekamilika: ${file}`);
        }
    }
}

async function cmdTables() {
    const query = `
        SELECT
            table_name,
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
    `;
    const res = await executeSql(query);
    if (Array.isArray(res)) {
        const grouped = {};
        for (const row of res) {
            if (!grouped[row.table_name]) grouped[row.table_name] = [];
            grouped[row.table_name].push(`${row.column_name} (${row.data_type}${row.is_nullable === "NO" ? ", NOT NULL" : ""})`);
        }
        for (const [tbl, cols] of Object.entries(grouped)) {
            console.log(`\n📋 public.${tbl}:`);
            cols.forEach(c => console.log(`   - ${c}`));
        }
    } else {
        console.log(res);
    }
}

function cmdNewMigration(slugArg) {
    if (!fs.existsSync(MIGRATIONS_DIR)) fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    const existing = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql")).sort();
    const nextNum = String(existing.length + 1).padStart(3, "0");
    const cleanSlug = String(slugArg || "update_tables")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    const filename = `${nextNum}_${cleanSlug}.sql`;
    const fullPath = path.join(MIGRATIONS_DIR, filename);

    const template = `-- ============================================================================
-- SILLYGER (SG) Automated Migration: ${filename}
-- Created at: ${new Date().toISOString()}
-- ============================================================================

-- Andika mabadiliko ya tables hapa (CREATE TABLE, ALTER TABLE, DROP COLUMN, RLS):

`;
    fs.writeFileSync(fullPath, template, "utf8");
    console.log(`✓ Migration mpya imetengenezwa: migrations/${filename}`);
}

async function cmdStatus() {
    const hasToken = !!getSupabaseAccessToken();
    const hasDbUrl = !!getDatabaseUrl();
    const ref = inferProjectRefFromConfig();

    console.log("=== SILLYGER AUTOMATED DB ENGINE STATUS ===");
    console.log(`Supabase Access Token (${DESKTOP_TOKEN_FILE}): ${hasToken ? "✅ IPO" : "❌ BADO HAIJAWEKWA"}`);
    console.log(`Direct DATABASE_URL (${DESKTOP_DB_URL_FILE}):   ${hasDbUrl ? "✅ IPO" : "— (Hiari)"}`);
    console.log(`Configured Project Ref:                         ${ref || "— (Itaundwa/itasomwa na bootstrap)"}`);

    if (hasToken && ref) {
        const res = await executeSql(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Majedwali yaliyopo live kwenye Cloud:", Array.isArray(res) ? res.map(r => r.table_name).join(", ") : res);
    }
}

async function main() {
    const [, , cmd, ...rest] = process.argv;
    try {
        switch (cmd) {
            case "bootstrap":
                await cmdBootstrap();
                break;
            case "migrate":
                await cmdMigrate();
                break;
            case "tables":
                await cmdTables();
                break;
            case "sql": {
                const sql = rest.join(" ").trim();
                if (!sql) throw new Error('Weka SQL, mfano: node scripts/db-auto.js sql "ALTER TABLE public.members ADD COLUMN bio TEXT;"');
                const out = await executeSql(sql);
                console.log(typeof out === "string" ? out : JSON.stringify(out, null, 2));
                break;
            }
            case "file": {
                const fileTarget = rest[0];
                if (!fileTarget) throw new Error("Weka njia ya faili la SQL.");
                const sql = fs.readFileSync(path.resolve(fileTarget), "utf8");
                const out = await executeSql(sql);
                console.log("✓ Faili la SQL limeendeshwa kikamilifu.");
                if (out && (!Array.isArray(out) || out.length > 0)) {
                    console.log(typeof out === "string" ? out : JSON.stringify(out, null, 2));
                }
                break;
            }
            case "new":
                cmdNewMigration(rest.join("_"));
                break;
            case "status":
            default:
                await cmdStatus();
                break;
        }
    } catch (err) {
        console.error("❌ Hitilafu:", err.message);
        process.exit(1);
    }
}

main();
