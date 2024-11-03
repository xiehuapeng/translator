const axios = require('axios');

async function testTranslate() {
    try {
        // 调用 LibreTranslate API 将输入文本翻译成中文
        const response = await axios.post('https://libretranslate.com/translate', {
            q: 'Hello, world!',      // 要翻译的文本
            source: 'auto',          // 自动检测源语言
            target: 'zh',            // 目标语言设置为中文
            api_key: '85f071b6-cf25-44c9-adb9-3a628da65e9f' // 使用你的 API 密钥
        }, {
            timeout: 30000           // 设置超时时间为 30 秒
        });

        console.log('翻译结果:', response.data.translatedText); // 输出翻译结果
    } catch (error) {
        console.error('翻译失败:', error);
    }
}

testTranslate();
