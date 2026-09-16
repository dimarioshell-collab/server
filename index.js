const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const USERS_FILE = path.join(__dirname, "users.json");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

// Убеждаемся, что файл с пользователями существует
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, "[]");
}

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Ошибка чтения users.json:", err);
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/submit" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { input } = JSON.parse(body);

        if (!input || typeof input !== "string" || !input.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Некорректные данные" }));
          return;
        }

        const users = readUsers();
        const newUser = {
          id: Date.now(),
          name: input.trim(),
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        saveUsers(users);

        console.log("Сохранён пользователь:", newUser);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            message: "Данные успешно сохранены",
            user: newUser,
          }),
        );
      } catch (err) {
        console.error("Ошибка обработки запроса:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Некорректный JSON" }));
      }
    });
  } else if (req.url === "/api/users" && req.method === "GET") {
    // Новый эндпоинт: получить список всех пользователей
    const users = readUsers();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(users));
  } else if (req.url === "/api/join" && req.method === "GET") {
    const users = readUsers();
    const newUser = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Пользователь успешно добавлен",
        user: newUser,
      }),
    );
  } else if (req.method === "GET") {
    let filePath = path.join(
      PUBLIC_DIR,
      req.url === "/" ? "index.html" : req.url,
    );

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          res.writeHead(500);
          res.end("Server error: " + err.code);
        }
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Открывайте с телефона: http://192.168.0.102:${PORT}/`);
});