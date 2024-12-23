console.log("background.js carregado");
// Monitora quando a aba ativa é alterada e injeta o script `content.js` para coletar dados.
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Obtém informações sobre a aba ativada
    const tab = await chrome.tabs.get(activeInfo.tabId);

    // Executa o script content.js na aba ativa
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scripts/content.js"]
        });
    } catch (error) {
        console.error("Erro ao injetar o script:", error);
    }
});

// Coleta informações sobre cookies



// Coleta informações sobre cache
function getCacheUsage() {
    const resources = performance.getEntriesByType('resource');
    let totalCacheSize = 0;

    resources.forEach((resource) => {
        if (resource.transferSize) {
            totalCacheSize += resource.transferSize; // Tamanho transferido
        }
    });
    console.log(totalCacheSize)
    return totalCacheSize; // Retorna tamanho total do cache
}

// Ouve mensagens do content.js
chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (sender.tab) {
        const tabUrl = new URL(sender.tab.url);
        const tabDomain = tabUrl.hostname;

        console.log("URL da aba ativa:", sender.tab.url); // Log para depuração
        console.log("Domínio da aba ativa:", tabDomain); // Log para depuração


        // Envia mensagem consolidada para o popup.js
        chrome.runtime.sendMessage({
            ...message, // Inclui os dados originais do content.js
        });
    }
});
