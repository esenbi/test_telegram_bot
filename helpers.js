export const isStartCommand = (update) => {
    return !!(update.message?.entities &&
        update.message.entities.some(e => e.type === 'bot_command') &&
        update.message.text === '/start');

}
