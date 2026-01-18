//scritp necessario para compartilhar a imagem
const ShareSystem = {
    share: async function() {
        const btn = document.getElementById('btnShare');
        if (!btn) return;

        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando imagem...';
        btn.disabled = true;

        try {
            if (typeof domtoimage === 'undefined') {
                throw new Error("A biblioteca dom-to-image não carregou.");
            }

            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => {
                input.setAttribute('value', input.value);
            });

            await new Promise(r => setTimeout(r, 500));

            const blob = await domtoimage.toBlob(document.body, {
                bgcolor: '#0f172a',
                width: document.body.scrollWidth,
                height: document.body.scrollHeight,
                style: {
                    'transform': 'scale(1)',
                    'transform-origin': 'top left',
                    'width': '100%',
                    'height': 'auto',
                    'overflow': 'visible'
                },
                filter: (node) => {
                    if (node.className && typeof node.className === 'string' && node.className.includes('pb-2')) {
                        return false;
                    }
                    if (node.tagName === 'BUTTON') {
                        return false;
                    }
                    return true;
                }
            });

            const file = new File([blob], 'metadriver-resultado.png', { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'MetaDriver',
                        files: [file]
                    });
                } catch (err) {
                    console.log("Compartilhamento cancelado");
                }
            } else {
                const link = document.createElement('a');
                link.download = 'metadriver-resultado.png';
                link.href = URL.createObjectURL(file);
                link.click();
                alert("Imagem baixada! Verifique seus downloads.");
            }

        } catch (error) {
            console.error("Erro ao gerar imagem:", error);
            alert("Erro ao criar a imagem. Tente novamente.");
        } finally {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
};