const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // 用于发送百度翻译 API 请求
const WebSocket = require('ws'); // 引入 WebSocket

const qs = require('qs'); // 引入 qs 库，用于序列化请求参数

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
        console.log('收到消息:', message);
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
    const fromLang = 'auto'; // 自动检测源语言
    const toLang = 'zh'; // 目标语言为中文
    const appid = "20241129002214707" //process.env.BAIDU_APP_ID; // 百度翻译 API 的 AppID
    const key = "UiwLef_34ucmSsoEh0pm"//process.env.BAIDU_API_KEY; // 百度翻译 API 的 API Key

    console.log('--------------------------------------');
    console.log('输入的文本:', inputText);
    console.log('\n');

    const salt = Math.random().toString(36).substring(2); // 随机生成一个 salt
    const sign = generateSign(appid, inputText, salt, key); // 生成签名

    try {
        // 使用百度翻译 API 进行翻译
        const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', qs.stringify({
            q: inputText,         // 要翻译的文本
            from: fromLang,       // 源语言
            to: toLang,           // 目标语言
            appid: appid,         // 百度翻译的 AppID
            salt: salt,           // 随机生成的 salt
            sign: sign            // 请求签名
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', // 设置 Content-Type
            }
        });

        // 打印 API 响应内容，检查返回的数据
        //console.log('百度翻译 API 响应:', response.data);

        // 检查返回的响应数据是否包含 trans_result
        if (response.data && response.data.trans_result && response.data.trans_result[0]) {
            // 返回翻译结果
			const translatedText = response.data.trans_result.map(item => item.dst).join('\n');
            res.json({
                status: 'success',
                message: '翻译成功',
                data: translatedText//response.data.trans_result[0].dst // 翻译结果
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: '翻译失败，未找到翻译结果',
                error: response.data.error_msg || '未知错误'
            });
        }
    } catch (error) {
        console.error('翻译失败:', error);

        res.status(500).json({
            status: 'error',
            message: '翻译失败，请稍后重试',
            error: error.message
        });
    }
});

// 生成签名的方法
function generateSign(appid, q, salt, key) {
    const md5 = require('md5'); // 使用 md5 加密
    return md5(appid + q + salt + key);
}

// 处理发送内容的请求
app.post('/send', (req, res) => {
    const dynamicContent = req.body.content; // 获取动态内容
    console.log('发送的内容:', dynamicContent);

    // 广播内容到所有连接的客户端
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(dynamicContent); // 广播内容
        }
    });

    // 返回内容确认和原始内容
    res.json({
        status: 'success',
        message: '内容已发送',
        originalContent: dynamicContent
    });
});
