const express = require('express');
const bodyParser = require('body-parser');
const translate = require('@vitalets/google-translate-api'); // 引入 google-translate-api

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // 允许访问 public 目录中的静态文件

// 处理 POST 请求
app.post('/submit', async (req, res) => {
    const inputText = req.body.inputText;

    // 打印到控制台
    console.log('输入的文本:', inputText);

    try {
        // 使用 google-translate-api 进行翻译
        const response = await translate(inputText, { to: 'zh-cn' }); // 设置目标语言为中文简体

        // 返回翻译结果
        res.send(response.text); // 将翻译结果发送给前端
    } catch (error) {
        console.error('翻译失败:', error);
        res.status(500).send('翻译失败，请稍后重试');
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器正在运行在 http://localhost:${PORT}`);
});
