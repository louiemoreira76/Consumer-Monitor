// Esse código coleta dados sobre memória e rede a cada 2 segundos
setInterval(() => {
    // Coleta informações de uso de memória
    const performanceData = window.performance.memory || {};
    console.log("Uso de memória:", performanceData.usedJSHeapSize); // Log para depuração

    // Coleta informações de uso de rede
    const connection = navigator.connection || {};
    console.log("Velocidade de rede:", connection.downlink); // Log para depuração

    const resources = performance.getEntriesByType('resource');
    let totalCacheSize = 0;

    resources.forEach((resource) => {
        if (resource.transferSize) {
            totalCacheSize += resource.transferSize; // Soma o tamanho transferido
        }
    });

    // Envia os dados coletados para o background.js
    chrome.runtime.sendMessage({
        ramUsage: performanceData.usedJSHeapSize || "N/A", // Memória usada em bytes
        networkSpeed: connection.downlink || "N/A", // Velocidade de download em Mbps
        cacheSize: totalCacheSize || "N/A",
    });
}, 2000);