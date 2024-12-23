document.addEventListener('DOMContentLoaded', () => {
    // Seleciona elementos para exibir os dados
    const ramElement = document.getElementById('ram');
    const netElement = document.getElementById('network');
    const tabNameElement = document.getElementById('tab-name');
    const performanceElement = document.getElementById('performance');
    const cacheElement = document.getElementById('cache');
    const loadTimeElement = document.getElementById("load-time");
    const totalSizeElement = document.getElementById("total-size");
    const requestCountElement = document.getElementById("request-count");
    const downloadSpeedElement = document.getElementById("download-speed");
    const uploadSpeedElement = document.getElementById("upload-speed");
     const browserVersionElement = document.getElementById('browser-version');
    const osElement = document.getElementById('os');
    const urlElement = document.getElementById('url');

    // Obtém a aba ativa Nao async
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const activeTab = tabs[0];
            tabNameElement.textContent = activeTab.title;

            urlElement.textContent = activeTab.url;
        } else {
            tabNameElement.textContent = "Nenhuma aba ativa";
        }
    });

     // Obtém informações do navegador e do sistema operacional
     browserVersionElement.textContent = navigator.userAgent;
     osElement.textContent = navigator.platform;

    // Aguarda mensagens do background.js
    chrome.runtime.onMessage.addListener((message) => {
        // Atualiza o valor de RAM
        ramElement.textContent = message.ramUsage !== "N/A" 
            ? `${(message.ramUsage / 1024 / 1024).toFixed(2)} MB` 
            : "N/A";

        // Atualiza o valor de Rede
        netElement.textContent = message.networkSpeed !== "N/A" 
            ? `${message.networkSpeed} Mbps` 
            : "N/A";

        // Atualiza o tamanho do cache
        cacheElement.textContent = message.cacheSize !== undefined 
            ? `${(message.cacheSize / 1024 / 1024).toFixed(2)} MB` 
            : "N/A";

        // Atualiza o tempo de execução do JavaScript
        const cpuTime = performance.now();
        performanceElement.textContent = `${cpuTime.toFixed(2)} ms`;
    });


       // Obtém a aba ativa async
       chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) {
            tabNameElement.textContent = "Nenhuma aba ativa";
            return;
        }

        const activeTab = tabs[0];
        tabNameElement.textContent = activeTab.title;

        try {
            // Tempo de carregamento
            const loadTime = await executeScript(activeTab.id, () => {
                const timing = window.performance.timing;
                return timing.loadEventEnd - timing.navigationStart;
            });
            loadTimeElement.textContent = loadTime > 0 ? `${loadTime} ms` : "N/A";

            // Tamanho total e requisições
            const { totalSize, requestCount } = await executeScript(activeTab.id, () => {
                const resources = window.performance.getEntriesByType("resource");
                const totalSize = resources.reduce((acc, res) => acc + res.transferSize, 0);
                return { totalSize, requestCount: resources.length };
            });
            totalSizeElement.textContent = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
            requestCountElement.textContent = `${requestCount} requisições`;

            // Cookies
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                if (tabs.length === 0) {
                    console.error("Nenhuma aba ativa encontrada.");
                    return;
                }
            
                const activeTab = tabs[0];
            
                try {
                    // Injeta script na aba para capturar cookies
                    const [result] = await chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        func: () => {
                            // Captura cookies usando document.cookie
                            return document.cookie;
                        },
                    });
            
                    const cookiesString = result.result;
            
                    if (!cookiesString) {
                        document.getElementById("cookies").textContent = "Nenhum cookie encontrado";
                    } else {
                        const cookiesArray = cookiesString.split(";").map(cookie => cookie.trim());
                        document.getElementById("cookies").textContent = `${cookiesArray.length} cookies encontrados: ${cookiesArray.join(", ")}`;
                    }
                } catch (error) {
                    console.error("Erro ao capturar cookies:", error);
                    document.getElementById("cookies").textContent = "Erro ao capturar cookies";
                }
            });
            

            // Função para medir a velocidade de download
const downloadSpeed = await executeScript(activeTab.id, () => {
    const resources = window.performance.getEntriesByType("resource");
    const totalDownloaded = resources.reduce((acc, res) => acc + res.transferSize, 0);
    const totalTime = resources.reduce((acc, res) => acc + res.duration, 0);
    return (totalDownloaded / (totalTime / 1000)) / (1024 * 1024); // Mbps
});
downloadSpeedElement.textContent = `${downloadSpeed.toFixed(2)} Mbps`;

// Medindo a velocidade de upload (simulação)
const uploadTestData = new Blob(new Array(10 * 1024 * 1024).fill('a')); // 10 MB de dados de teste
const uploadSize = uploadTestData.size; // Tamanho dos dados em bytes

const uploadStartTime = performance.now();

// Simulando o upload
await new Promise((resolve) => {
    // Simula o tempo de upload
    const uploadDuration = Math.random() * 2000 + 1000; // Simula entre 1 e 3 segundos
    setTimeout(() => {
        const uploadEndTime = performance.now();
        const actualUploadDuration = uploadEndTime - uploadStartTime;

        // Calcular a velocidade de upload em Mbps
        const uploadSpeed = (uploadSize / actualUploadDuration) * 1000; // bytes/ms to bytes/s
        const uploadSpeedMbps = (uploadSpeed / (1024 * 1024)); // Convertendo para Mbps
        uploadSpeedElement.textContent = `Velocidade de Upload: ${uploadSpeedMbps.toFixed(2)} Mbps`;
        resolve();
    }, uploadDuration); // Simula o tempo de upload
});
        } catch (error) {
            console.error("Erro ao executar script:", error);
        }
    });

    // Função para executar scripts na aba ativa
    function executeScript(tabId, func) {
        return new Promise((resolve, reject) => {
            chrome.scripting.executeScript(
                { target: { tabId }, func },
                (results) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                    } else {
                        resolve(results[0]?.result);
                    }
                }
            );
        });
    }
});