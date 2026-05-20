// Airconf Quiz – Local Node.js Server
// Run with: node server.js
// Then open: http://192.168.0.169:3000

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT    = 3000;
const RESULTS = path.join(__dirname, "results.json");

// Init results file if missing
if (!fs.existsSync(RESULTS)) fs.writeFileSync(RESULTS, JSON.stringify([]));

const server = http.createServer((req, res) => {
    // CORS – allow all origins (needed for browser fetch)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    // POST /score  – save a result
    if (req.method === "POST" && req.url === "/score") {
        let body = "";
        req.on("data", d => body += d);
        req.on("end", () => {
            try {
                const entry = JSON.parse(body);
                entry.timestamp = new Date().toISOString();
                const all = JSON.parse(fs.readFileSync(RESULTS));
                all.push(entry);
                fs.writeFileSync(RESULTS, JSON.stringify(all, null, 2));
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "ok" }));
            } catch (e) {
                res.writeHead(400); res.end("Bad request");
            }
        });
        return;
    }

    // GET /results – live leaderboard (JSON)
    if (req.method === "GET" && req.url.startsWith("/results")) {
        const all = JSON.parse(fs.readFileSync(RESULTS));
        all.sort((a, b) => b.score - a.score);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(all, null, 2));
        return;
    }

    // GET /results.csv – download for Excel
    if (req.method === "GET" && req.url.startsWith("/results.csv")) {
        const all = JSON.parse(fs.readFileSync(RESULTS));
        all.sort((a, b) => b.score - a.score);
        const csv = ["Timestamp,Name,Score,Correct,Total"]
            .concat(all.map(r => `${r.timestamp},${r.name},${r.score},${r.correct},${r.total}`))
            .join("\n");
        res.writeHead(200, { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=results.csv" });
        res.end(csv);
        return;
    }

    // GET /leaderboard – serve the leaderboard HTML
    if (req.method === "GET" && req.url === "/leaderboard") {
        const html = path.join(__dirname, "leaderboard.html");
        if (!fs.existsSync(html)) { res.writeHead(404); res.end("leaderboard.html not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(html));
        return;
    }

    // GET / – serve the quiz HTML
    if (req.method === "GET" && req.url === "/") {
        const html = path.join(__dirname, "quiz.html"); // ← rename this to match your actual filename
        if (!fs.existsSync(html)) { res.writeHead(404); res.end("quiz.html not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(html));
        return;
    }

    res.writeHead(404); res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ Airconf Quiz Server running!`);
    console.log(`   Local:    http://localhost:${PORT}`);
    console.log(`   Network:  http://192.168.0.169:${PORT}  ← share this with participants`);
    console.log(`   Results:  http://192.168.0.169:${PORT}/results`);
    console.log(`   CSV:      http://192.168.0.169:${PORT}/results.csv\n`);
});