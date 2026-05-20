// Airconf Quiz – Local Node.js Server
// Run with: node server.js
// Then open: http://192.168.0.169:3000

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT    = process.env.PORT || 3000;
const RESULTS = path.join(__dirname, "results.json");

// Init results file if missing
if (!fs.existsSync(RESULTS)) fs.writeFileSync(RESULTS, JSON.stringify([]));

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    const url = req.url.split("?")[0];

    // POST /score
    if (req.method === "POST" && url === "/score") {
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

    // GET /results.csv
    if (req.method === "GET" && url === "/results.csv") {
        const all = JSON.parse(fs.readFileSync(RESULTS));
        all.sort((a, b) => b.score - a.score);
        const csv = ["Timestamp,Name,Score,Correct,Total"]
            .concat(all.map(r => `${r.timestamp},${r.name},${r.score},${r.correct},${r.total}`))
            .join("\n");
        res.writeHead(200, { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=results.csv" });
        res.end(csv);
        return;
    }

    // GET /results
    if (req.method === "GET" && url === "/results") {
        const all = JSON.parse(fs.readFileSync(RESULTS));
        all.sort((a, b) => b.score - a.score);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(all, null, 2));
        return;
    }

    // GET /leaderboard
    if (req.method === "GET" && url === "/leaderboard") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(path.join(__dirname, "leaderboard.html")));
        return;
    }

    // GET / or /index.html
    if (req.method === "GET" && (url === "/" || url === "/index.html")) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(path.join(__dirname, "quiz.html")));
        return;
    }

    // GET /health (for Render health checks)
    if (req.method === "GET" && url === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found: " + url);
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ Airconf Quiz Server running on port ${PORT}`);
});