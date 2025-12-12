// ============================================
// CONFIGURAÇÃO E VARIÁVEIS
// ============================================
let currentSlide = 0;
let slides = [];
let indicators = [];
let isTransitioning = false;
let touchStartX = 0;
let touchEndX = 0;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeSlides();
    initializeIndicators();
    initializeNavigation();
    initializeKeyboard();
    initializeTouch();
    initializeProgressBar();
    initializeCharts();
    
    // Mostrar primeiro slide
    goToSlide(0);
});

// ============================================
// INICIALIZAR SLIDES
// ============================================
function initializeSlides() {
    slides = Array.from(document.querySelectorAll('.slide'));
    console.log(`Total de slides: ${slides.length}`);
}

// ============================================
// INICIALIZAR INDICADORES
// ============================================
function initializeIndicators() {
    const indicatorsContainer = document.getElementById('slideIndicators');
    
    slides.forEach((slide, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'indicator';
        indicator.setAttribute('data-slide', index);
        indicator.setAttribute('aria-label', `Ir para slide ${index + 1}`);
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
        indicators.push(indicator);
    });
}

// ============================================
// INICIALIZAR NAVEGAÇÃO
// ============================================
function initializeNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.addEventListener('click', () => previousSlide());
    nextBtn.addEventListener('click', () => nextSlide());
    
    updateNavigationButtons();
}

// ============================================
// NAVEGAÇÃO ENTRE SLIDES
// ============================================
function goToSlide(index) {
    if (isTransitioning || index < 0 || index >= slides.length) {
        return;
    }
    
    isTransitioning = true;
    
    // Remover classe active de todos os slides
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev');
        if (i < index) {
            slide.classList.add('prev');
        }
    });
    
    // Adicionar classe active ao slide atual
    slides[index].classList.add('active');
    
    // Atualizar indicadores
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    
    // Atualizar botões de navegação
    updateNavigationButtons();
    
    // Atualizar progress bar
    updateProgressBar();
    
    // Scroll para o topo do slide
    slides[index].scrollTop = 0;
    
    // Resetar flag de transição após animação
    setTimeout(() => {
        isTransitioning = false;
        // Verificar se precisa criar gráfico
        checkAndCreateChart();
    }, 500);
    
    currentSlide = index;
}

function nextSlide() {
    if (currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
    }
}

function previousSlide() {
    if (currentSlide > 0) {
        goToSlide(currentSlide - 1);
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
}

// ============================================
// NAVEGAÇÃO POR TECLADO
// ============================================
function initializeKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (isTransitioning) return;
        
        switch(e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                previousSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(slides.length - 1);
                break;
        }
    });
}

// ============================================
// NAVEGAÇÃO POR TOUCH/SWIPE
// ============================================
function initializeTouch() {
    const container = document.getElementById('presentationContainer');
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    if (isTransitioning) return;
    
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - próximo slide
            nextSlide();
        } else {
            // Swipe right - slide anterior
            previousSlide();
        }
    }
}

// ============================================
// PROGRESS BAR
// ============================================
function initializeProgressBar() {
    updateProgressBar();
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progress = ((currentSlide + 1) / slides.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// ============================================
// GRÁFICOS
// ============================================
function initializeCharts() {
    // O gráfico será criado quando o slide 11 for visualizado
    // Não criar aqui para evitar problemas de renderização
}

function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
        console.warn('Canvas do gráfico não encontrado');
        return;
    }
    
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não está carregado');
        return;
    }
    
    // Dados das projeções
    const months = ['Mês 0', 'Mês 3', 'Mês 6', 'Mês 9', 'Mês 12'];
    const conservative = [0, 2500, 10000, 17500, 25000];
    const optimistic = [0, 7500, 25000, 50000, 75000];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Projeção Conservadora',
                    data: conservative,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Projeção Otimista',
                    data: optimistic,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Projeção de Receita Mensal (R$)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': R$ ' + context.parsed.y.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    },
                    title: {
                        display: true,
                        text: 'Receita Mensal (R$)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Período'
                    }
                }
            }
        }
    });
}

// ============================================
// OBSERVADOR PARA GRÁFICOS
// ============================================
let revenueChartCreated = false;

// Criar gráfico quando o slide 11 for visualizado
function checkAndCreateChart() {
    if (currentSlide === 10 && !revenueChartCreated) { // Slide 11 (índice 10)
        setTimeout(() => {
            createRevenueChart();
            revenueChartCreated = true;
        }, 300);
    }
}

// ============================================
// PREVENIR SCROLL ACIDENTAL
// ============================================
document.addEventListener('wheel', (e) => {
    const activeSlide = document.querySelector('.slide.active');
    if (activeSlide) {
        const isAtTop = activeSlide.scrollTop === 0;
        const isAtBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 1;
        
        if ((e.deltaY > 0 && isAtBottom) || (e.deltaY < 0 && isAtTop)) {
            e.preventDefault();
            if (e.deltaY > 0) {
                nextSlide();
            } else {
                previousSlide();
            }
        }
    }
}, { passive: false });

// ============================================
// FULLSCREEN (OPCIONAL)
// ============================================
document.addEventListener('keydown', (e) => {
    // F11 ou F para fullscreen
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Erro ao entrar em fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Ajustar layout quando entrar/sair do fullscreen
document.addEventListener('fullscreenchange', () => {
    // Forçar redimensionamento
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        // Recriar gráfico se necessário
        if (currentSlide === 10 && revenueChartCreated) {
            checkAndCreateChart();
        }
    }, 100);
});

// Suporte para diferentes navegadores
document.addEventListener('webkitfullscreenchange', () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (currentSlide === 10 && revenueChartCreated) {
            checkAndCreateChart();
        }
    }, 100);
});

document.addEventListener('mozfullscreenchange', () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (currentSlide === 10 && revenueChartCreated) {
            checkAndCreateChart();
        }
    }, 100);
});

document.addEventListener('MSFullscreenChange', () => {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (currentSlide === 10 && revenueChartCreated) {
            checkAndCreateChart();
        }
    }, 100);
});

// ============================================
// ATALHOS ÚTEIS
// ============================================
document.addEventListener('keydown', (e) => {
    // ESC para sair do fullscreen
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
});

// ============================================
// LOG DE NAVEGAÇÃO (DEBUG)
// ============================================
function logNavigation(direction) {
    console.log(`Navegação: ${direction}, Slide atual: ${currentSlide + 1}/${slides.length}`);
}

// ============================================
// EXPORT PARA DEBUG
// ============================================
window.presentationControls = {
    goToSlide,
    nextSlide,
    previousSlide,
    getCurrentSlide: () => currentSlide + 1,
    getTotalSlides: () => slides.length
};

