require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WEB_APP_URL = process.env.WEB_APP_URL;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}/test`;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('🚀 Telegram bot backend is running!');
});

app.post('/send-order', async (req, res) => {
    const { order_id, items } = req.body;

    if (!order_id || !items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'order_id and items (array) are required' });
    }

    try {
        // 1. Format item list for the message
        const itemList = items.map((item, i) => `${i + 1}. ${item}`).join('\n');

        // 2. Send message with item details
        const sendResponse = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: CHAT_ID,
            text: `🍕 Новый заказ #${order_id}:\n\n${itemList}`,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Собрать заказ',
                            web_app: { url: `${WEB_APP_URL}` } // temp
                        }
                    ]
                ]
            }
        });

        const message_id = sendResponse.data.result.message_id;

        // 3. URL encode items array and build the final Mini App URL
        const queryParams = new URLSearchParams({
            order_id,
            message_id,
            chat_id: CHAT_ID,
            items: JSON.stringify(items)
        }).toString();

        const updatedUrl = `${WEB_APP_URL}?${queryParams}`;

        // 4. Edit button with full query string
        await axios.post(`${TELEGRAM_API}/editMessageReplyMarkup`, {
            chat_id: CHAT_ID,
            message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Собрать заказ',
                            web_app: { url: updatedUrl }
                        }
                    ]
                ]
            }
        });

        res.json({ success: true, message_id });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/mark-done', async (req, res) => {
    const { chat_id, message_id, order_id } = req.body;

    if (!chat_id || !message_id) {
        return res.status(400).json({ success: false, error: 'chat_id and message_id are required' });
    }

    try {
        const newText = `✅ Заказ #${order_id || 'N/A'} собран. Спасибо!`;

        await axios.post(`${TELEGRAM_API}/editMessageText`, {
            chat_id,
            message_id,
            text: newText
            // reply_markup omitted to remove buttons
        });

        res.json({ success: true, message: 'Order marked as done' });
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
