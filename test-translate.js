const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // 用于发送 LibreTranslate API 请求
const WebSocket = require('ws'); // 引入 WebSocket

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // 允许访问 public 目录中的静态文件

// 创建一个 HTTP 服务器
const server = app.listen(PORT, () => {
    console.log(`服务器正在运行在 http://localhost:${PORT}`);
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 处理 WebSocket 连接
wss.on('connection', (ws) => {
    console.log('新客户端连接');

    ws.on('message', (message) => {
        // 当接收到消息时，广播给所有连接的客户端
        //console.log('收到消息:', message);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('客户端断开连接');
    });
});

// 处理 POST 请求
app.post('/submit', async (req, res) => {
    const inputText = req.body.inputText;

    // 打印到控制台
    console.log('--------------------------------------');
    console.log('输入的文本:', inputText);
    console.log('\n');

    try {
        // 使用 LibreTranslate API 进行翻译
        const response = await axios.post('https://libretranslate.com/translate', {
            q: inputText,          // 要翻译的文本
            source: 'auto',        // 自动检测源语言
            target: 'zh',          // 目标语言设置为中文
            api_key: '85f071b6-cf25-44c9-adb9-3a628da65e9f' // 替换为你的 API 密钥
        }, {
            timeout: 30000          // 可选：设置超时时间为 30 秒
        });

        // 返回翻译结果
        res.send(response.data.translatedText); // 将翻译结果发送给前端
    } catch (error) {
        console.error('翻译失败:', error);
        res.status(500).send('翻译失败，请稍后重试');
    }
});

// 处理发送内容的请求
app.post('/send', (req, res) => {
    const dynamicContent = req.body.content; // 获取动态内容
    //console.log('发送的内容:', dynamicContent);

    // 广播内容到所有连接的客户端
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dynamicContent); // 广播内容
        }
    });

    // 返回内容确认和原始内容
    res.json({
        message: '内容已发送',
        originalContent: dynamicContent
    });
});
